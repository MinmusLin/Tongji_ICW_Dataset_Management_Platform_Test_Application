import xml.etree.ElementTree as ET

def parse_zap_report(xml_file):
    tree = ET.parse(xml_file)
    root = tree.getroot()

    findings = {
        'high': [],
        'medium': [],
        'low': []
    }

    for alert in root.findall('.//alertitem'):
        risk = alert.find('riskcode').text
        name = alert.find('alert').text
        desc = alert.find('desc').text[:100] + '...' if len(alert.find('desc').text) > 100 else alert.find('desc').text

        if risk == '3':
            findings['high'].append(f'{name}: {desc}')
        elif risk == '2':
            findings['medium'].append(f'{name}: {desc}')
        else:
            findings['low'].append(f'{name}: {desc}')

    return findings

if __name__ == '__main__':
    results = parse_zap_report('security_report.xml')
    for level, issues in results.items():
        print(f'\n{level.upper()} RISK ISSUES ({len(issues)}):')
        for issue in issues:
            print(f'- {issue}')