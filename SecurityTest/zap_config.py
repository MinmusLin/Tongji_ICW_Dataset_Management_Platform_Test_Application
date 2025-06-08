from zapv2 import ZAPv2

zap = ZAPv2(proxies={'http': 'http://127.0.0.1:8080', 'https': 'http://127.0.0.1:8080'})

context_name = 'OSS-API-Test'
target_url = 'http://110.42.214.164'
api_endpoints = [
    '/simplePut',
    '/multipartUpload',
    '/fileList',
    '/deleteKey'
]

context_id = zap.context.new_context(context_name)

zap.context.include_in_context(context_name, f'{target_url}.*')

auth_token = '${AUTH_TOKEN}'
zap.authentication.set_authentication_method(
    context_id,
    'bearerToken',
    'token=' + auth_token
)
zap.script.load(
    'bearerToken.js',
    'authentication',
    'Oracle Nashorn',
    "function authenticate(helper, params, credentials) { return 'Bearer ' + credentials.getParam('token'); }"
)

scan_policy_name = 'API-Scan-Policy'
zap.ascan.enable_all_scanners(scanpolicyname=scan_policy_name)
zap.ascan.set_scanner_alert_threshold('SQL_Injection', 'High')
zap.ascan.set_scanner_alert_threshold('XSS', 'High')

print(f'ZAP configuration completed for {target_url}')