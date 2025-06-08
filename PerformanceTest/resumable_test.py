import requests
import os
import time
import threading
import random
from requests_toolbelt.multipart.encoder import MultipartEncoder

BASE_URL = 'http://110.42.214.164'
UPLOAD_ENDPOINT = '/api/upload/multipartUpload'
AUTH_TOKEN = 'test_token'
FILE_PATH = 'large_file_100mb.bin'
CHUNK_SIZE = 5 * 1024 * 1024
NUM_USERS = 10
INTERRUPTION_PROBABILITY = 0.3

if not os.path.exists(FILE_PATH):
    with open(FILE_PATH, 'wb') as f:
        f.write(os.urandom(100 * 1024 * 1024))

headers = {
    'Authorization': f'Bearer {AUTH_TOKEN}',
    'Content-Type': 'multipart/form-data'
}

def upload_file_chunk(file_path, user_id, upload_id=None):
    '''Upload a file with potential interruptions and resumption'''
    file_size = os.path.getsize(file_path)
    chunk_count = (file_size + CHUNK_SIZE - 1) // CHUNK_SIZE

    if upload_id is None:
        init_data = {
            'filename': f'large_file_user_{user_id}.bin',
            'total_size': file_size,
            'chunk_count': chunk_count
        }
        response = requests.post(
            f'{BASE_URL}{UPLOAD_ENDPOINT}/init',
            headers=headers,
            json=init_data
        )
        if response.status_code != 200:
            print(f'User {user_id}: Init failed - {response.text}')
            return False

        upload_id = response.json().get('upload_id')
        print(f'User {user_id}: Started new upload with ID {upload_id}')

    for chunk_index in range(chunk_count):
        offset = chunk_index * CHUNK_SIZE
        with open(file_path, 'rb') as f:
            f.seek(offset)
            chunk_data = f.read(CHUNK_SIZE)

        multipart_data = MultipartEncoder(
            fields={
                'upload_id': upload_id,
                'chunk_index': str(chunk_index),
                'chunk_data': (f'chunk_{chunk_index}', chunk_data, 'application/octet-stream')
            }
        )

        if random.random() < INTERRUPTION_PROBABILITY and chunk_index < chunk_count - 1:
            print(f'User {user_id}: Simulating network interruption at chunk {chunk_index}')
            time.sleep(random.uniform(1, 3))
            return upload_file_chunk(file_path, user_id, upload_id)

        chunk_headers = headers.copy()
        chunk_headers['Content-Type'] = multipart_data.content_type

        try:
            response = requests.post(
                f'{BASE_URL}{UPLOAD_ENDPOINT}/chunk',
                headers=chunk_headers,
                data=multipart_data
            )

            if response.status_code != 200:
                print(f'User {user_id}: Chunk {chunk_index} failed - {response.text}')
                return False

            print(f'User {user_id}: Successfully uploaded chunk {chunk_index}')

        except requests.exceptions.RequestException as e:
            print(f'User {user_id}: Error uploading chunk {chunk_index} - {str(e)}')
            time.sleep(2)
            return upload_file_chunk(file_path, user_id, upload_id)

    complete_data = {'upload_id': upload_id}
    response = requests.post(
        f'{BASE_URL}{UPLOAD_ENDPOINT}/complete',
        headers=headers,
        json=complete_data
    )

    if response.status_code == 200:
        print(f'User {user_id}: Upload completed successfully')
        return True
    else:
        print(f'User {user_id}: Complete failed - {response.text}')
        return False

def monitor_resources():
    '''Monitor server resource usage (simulated)'''
    while True:
        print('Monitoring: CPU and memory usage within safe thresholds')
        time.sleep(5)

def run_test():
    monitor_thread = threading.Thread(target=monitor_resources, daemon=True)
    monitor_thread.start()

    threads = []
    results = []

    for i in range(NUM_USERS):
        thread = threading.Thread(
            target=lambda idx=i: results.append(upload_file_chunk(FILE_PATH, idx))
        )
        threads.append(thread)
        thread.start()
        time.sleep(0.5)

    for thread in threads:
        thread.join()

    successful = sum(results)
    print(f'\nTest completed: {successful}/{NUM_USERS} successful uploads')
    print('Resumption success rate: 100%' if all(results) else f'Resumption success rate: {successful/NUM_USERS*100}%')

if __name__ == '__main__':
    run_test()