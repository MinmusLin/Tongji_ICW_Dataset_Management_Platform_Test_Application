#!/bin/bash

zap.sh -daemon -port 8080 -config api.key=${AUTH_TOKEN} &

sleep 30

echo "Running baseline scan..."
zap-baseline.py -t http://110.42.214.164 \
  -c zap_config.py \
  -r baseline_report.html \
  -x baseline_report.xml \
  -P 8080 \
  -J

echo "Running active scan..."
zap-full-scan.py -t http://110.42.214.164 \
  -c zap_config.py \
  -m 30 \
  -r security_report.html \
  -x security_report.xml \
  -d \
  -P 8080 \
  -U admin -P zapadmin

zap-cli report -o report.md -f md

pkill -f zap.sh