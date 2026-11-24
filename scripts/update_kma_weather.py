#!/usr/bin/env python3
"""기상청 동네예보 getVilageFcst → 월~금 오전 07시 날씨 JSON.

KMA_SERVICE_KEY 환경변수에 공공데이터포털 일반 인증키(Decoding)를 넣습니다.
정확히 07시 예보가 없는 마지막 날은 06시/08시(가까운 시간) 자료를 사용합니다.
API 오류 시 기존 weather.json은 덮어쓰지 않습니다.
"""
import json
import math
import os
import sys
import time
import urllib.parse
import urllib.request
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path

TZ = timezone(timedelta(hours=9))
BASE_TIMES = (2, 5, 8, 11, 14, 17, 20, 23)
URL = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst'
TARGET_LAT = 37.7557185972725
TARGET_LON = 126.784778250987
OUTPUT = Path(__file__).resolve().parent.parent / 'weather.json'

def xy_for(lat, lon):
    # 기상청 동네예보 5km Lambert Conformal Conic 격자 변환
    deg = math.pi / 180
    re = 6371.00877 / 5.0
    slat1, slat2, olon, olat = [n * deg for n in (30, 60, 126, 38)]
    sn = math.log(math.cos(slat1) / math.cos(slat2)) / math.log(
        math.tan(math.pi/4 + slat2/2) / math.tan(math.pi/4 + slat1/2))
    sf = (math.tan(math.pi/4 + slat1/2)**sn) * math.cos(slat1) / sn
    ro = re * sf / (math.tan(math.pi/4 + olat/2)**sn)
    ra = re * sf / (math.tan(math.pi/4 + lat*deg/2)**sn)
    theta = (lon*deg - olon)
    if theta > math.pi: theta -= 2*math.pi
    if theta < -math.pi: theta += 2*math.pi
    theta *= sn
    return int(math.floor(ra * math.sin(theta) + 43 + .5)), int(math.floor(ro - ra * math.cos(theta) + 136 + .5))

def base_candidates(now):
    # 발표 후 배포 지연을 감안해 30분 경과한 기준시각부터 시도
    cutoff = now - timedelta(minutes=30)
    day = cutoff.date()
    for offset in range(0, 3):
        d = day - timedelta(days=offset)
        for h in reversed(BASE_TIMES):
            base = datetime(d.year, d.month, d.day, h, tzinfo=TZ)
            if base <= cutoff:
                yield base

def get_items(base, api_key, nx, ny):
    items = []
    page = 1
    while True:
        query = urllib.parse.urlencode({
            'serviceKey': api_key,
            'pageNo': page,
            'numOfRows': 2000,
            'dataType': 'JSON',
            'base_date': base.strftime('%Y%m%d'),
            'base_time': base.strftime('%H00'),
            'nx': nx,
            'ny': ny,
        })
        request = urllib.request.Request(URL + '?' + query, headers={'User-Agent':'BrothersTennisClubHub/1.0'})
        with urllib.request.urlopen(request, timeout=25) as response:
            content = json.load(response)
        header = content.get('response', {}).get('header', {})
        if str(header.get('resultCode', '')) != '00':
            raise RuntimeError('기상청 API 오류: ' + str(header.get('resultMsg', 'unknown')))
        body = content['response']['body']
        page_items = body.get('items', {}).get('item', [])
        items.extend(page_items)
        total = int(body.get('totalCount', len(items)))
        if not page_items or len(items) >= total:
            break
        page += 1
        if page > 8:
            raise RuntimeError('API 페이지 응답이 너무 많습니다.')
    if not items:
        raise RuntimeError('API 응답에 예보 정보가 없습니다.')
    return items

def interpret_icon(item):
    pty = str(item.get('PTY', '0'))
    if pty in ('1','5'): return 'rain'
    if pty == '4': return 'shower'
    if pty in ('2','6'): return 'sleet'
    if pty in ('3','7'): return 'snow'
    sky = str(item.get('SKY', ''))
    return {'1':'clear', '3':'partly', '4':'cloudy'}.get(sky, 'unknown')

def create_forecasts(items, now):
    by_day_hour = defaultdict(dict)
    for entry in items:
        date, hour, code = entry.get('fcstDate',''), entry.get('fcstTime',''), entry.get('category','')
        if code in ('TMP','SKY','PTY','POP') and date and hour:
            by_day_hour[(date, hour)][code] = entry.get('fcstValue')
    # 이번 주와 다음 주의 모든 평일 중 최대 7일까지만, 날짜 카드에 자동 매칭됨
    result = {}
    today = now.date()
    for day_no in range(0, 8):
        day = today + timedelta(days=day_no)
        if day.weekday() >= 5: continue
        key = day.strftime('%Y%m%d')
        # 07시 우선, 5일째 3시간 간격으로 발표되는 경우 가까운 시간 사용
        for hour in ('0700', '0600', '0800', '0900'):
            parts = by_day_hour.get((key, hour), {})
            if 'TMP' not in parts: continue
            try: temp = float(parts['TMP'])
            except (ValueError, TypeError): continue
            try: pop = int(float(parts['POP'])) if 'POP' in parts else None
            except (ValueError, TypeError): pop = None
            result[day.isoformat()] = {
                'temp': temp,
                'pop': pop,
                'icon': interpret_icon(parts),
                'time': hour,
                'label': '07시 예보' if hour == '0700' else f'근접 {hour[:2]}시 예보',
            }
            break
    return result

def main():
    key = os.environ.get('KMA_SERVICE_KEY', '').strip()
    if not key:
        print('KMA_SERVICE_KEY가 비어 있습니다. GitHub Secrets를 설정하세요.', file=sys.stderr)
        return 2
    # 혹시 Encoding 키를 붙여넣은 경우 이중 인코딩 방지
    if '%2F' in key or '%2B' in key or '%3D' in key:
        key = urllib.parse.unquote(key)
    now = datetime.now(TZ)
    nx, ny = xy_for(TARGET_LAT, TARGET_LON)
    print(f'Location {TARGET_LAT}, {TARGET_LON} → KMA nx={nx}, ny={ny}')
    errors = []
    for base in base_candidates(now):
        try:
            items = get_items(base, key, nx, ny)
            days = create_forecasts(items, now)
            if not days:
                raise RuntimeError('조회한 예보에서 해당 날짜 오전 자료를 찾지 못함')
            # 당일 07시가 지난 뒤 최신 예보에서 07시 값이 제외되더라도,
            # 저장돼 있던 당일 오전 7시 예보는 그날까지 유지합니다.
            if OUTPUT.exists() and now.hour >= 7:
                try:
                    old_days = json.loads(OUTPUT.read_text(encoding='utf-8')).get('days', {})
                    today_key = now.date().isoformat()
                    if today_key not in days and today_key in old_days:
                        days[today_key] = old_days[today_key]
                except (ValueError, OSError, AttributeError):
                    pass
            document = {
                'source': '기상청 단기예보 조회서비스 (data.go.kr)',
                'place': '파주스타디움 테니스장 인근',
                'referenceTime': '07:00 Asia/Seoul (일부 날짜 최근접 오전 시각)',
                'updatedAt': now.isoformat(timespec='minutes'),
                'forecastBase': base.isoformat(timespec='minutes'),
                'grid': {'nx': nx, 'ny': ny},
                'days': days,
            }
            OUTPUT.write_text(json.dumps(document, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
            print(f'Updated {OUTPUT.name}: {len(days)} days from {base:%Y-%m-%d %H:%M} KST')
            return 0
        except Exception as exc:
            errors.append(f'{base.isoformat()}: {type(exc).__name__} {exc}')
            time.sleep(1)
    print('최근 기준시각 API 호출에 모두 실패했습니다. 기존 weather.json을 보존합니다.\n' + '\n'.join(errors), file=sys.stderr)
    return 1

if __name__ == '__main__':
    sys.exit(main())
