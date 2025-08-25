import React, { useState, useEffect } from 'react';
import './LocationSettings.css';

const LocationSettings = ({ onLocationSet, currentLocation }) => {
  const [targetLocation, setTargetLocation] = useState(currentLocation || null);
  const [radius, setRadius] = useState(10); // 기본 10m
  const [isSettingLocation, setIsSettingLocation] = useState(false);
  const [locationName, setLocationName] = useState('');

  // 현재 위치 가져오기
  const getCurrentLocation = () => {
    setIsSettingLocation(true);

    if (!navigator.geolocation) {
      alert('이 브라우저는 위치 정보를 지원하지 않습니다.');
      setIsSettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newLocation = { lat: latitude, lng: longitude };
        
        setTargetLocation(newLocation);
        setIsSettingLocation(false);
        
        // 위치 이름이 없으면 자동으로 설정
        if (!locationName) {
          setLocationName(`투표장소_${new Date().toLocaleDateString()}`);
        }
      },
      (error) => {
        let errorMessage = '위치 정보를 가져올 수 없습니다.';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '위치 정보 접근이 거부되었습니다.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = '위치 정보를 사용할 수 없습니다.';
            break;
          case error.TIMEOUT:
            errorMessage = '위치 정보 요청 시간이 초과되었습니다.';
            break;
          default:
            errorMessage = '알 수 없는 오류가 발생했습니다.';
        }
        
        alert(errorMessage);
        setIsSettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  // 수동으로 좌표 입력
  const handleManualInput = () => {
    const lat = parseFloat(document.getElementById('manual-lat').value);
    const lng = parseFloat(document.getElementById('manual-lng').value);
    
    if (isNaN(lat) || isNaN(lng)) {
      alert('올바른 좌표값을 입력해주세요.');
      return;
    }
    
    if (lat < -90 || lat > 90) {
      alert('위도는 -90에서 90 사이의 값이어야 합니다.');
      return;
    }
    
    if (lng < -180 || lng > 180) {
      alert('경도는 -180에서 180 사이의 값이어야 합니다.');
      return;
    }
    
    setTargetLocation({ lat, lng });
  };

  // 위치 설정 완료
  const handleLocationSet = () => {
    if (!targetLocation) {
      alert('먼저 위치를 설정해주세요.');
      return;
    }
    
    if (!locationName.trim()) {
      alert('위치 이름을 입력해주세요.');
      return;
    }
    
    const locationData = {
      ...targetLocation,
      name: locationName.trim(),
      radius: radius,
      setAt: new Date().toISOString()
    };
    
    onLocationSet(locationData);
  };

  // 위치 초기화
  const resetLocation = () => {
    setTargetLocation(null);
    setLocationName('');
    setRadius(10);
  };

  return (
    <div className="location-settings">
      <div className="location-settings-header">
        <h3>📍 투표 장소 위치 설정</h3>
        <p>가요제 현장의 정확한 위치를 설정하여 외부 인원의 투표를 방지합니다.</p>
      </div>

      <div className="location-settings-content">
        {/* 위치 이름 설정 */}
        <div className="setting-group">
          <label htmlFor="location-name">위치 이름</label>
          <input
            id="location-name"
            type="text"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="예: 가요제 메인 무대"
            className="location-input"
          />
        </div>

        {/* 반경 설정 */}
        <div className="setting-group">
          <label htmlFor="radius">허용 반경 (미터)</label>
          <div className="radius-input-group">
            <input
              id="radius"
              type="range"
              min="5"
              max="100"
              value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value))}
              className="radius-slider"
            />
            <span className="radius-value">{radius}m</span>
          </div>
          <small>5m ~ 100m 사이에서 설정 가능합니다.</small>
        </div>

        {/* 위치 설정 방법 */}
        <div className="location-methods">
          <div className="method-section">
            <h4>방법 1: 현재 위치 자동 설정</h4>
            <button
              className="get-location-btn"
              onClick={getCurrentLocation}
              disabled={isSettingLocation}
            >
              {isSettingLocation ? '📍 위치 확인 중...' : '📍 현재 위치로 설정'}
            </button>
          </div>

          <div className="method-section">
            <h4>방법 2: 좌표 수동 입력</h4>
            <div className="coordinate-inputs">
              <div className="coordinate-input">
                <label htmlFor="manual-lat">위도</label>
                <input
                  id="manual-lat"
                  type="number"
                  step="any"
                  placeholder="37.5665"
                  className="coordinate-field"
                />
              </div>
              <div className="coordinate-input">
                <label htmlFor="manual-lng">경도</label>
                <input
                  id="manual-lng"
                  type="number"
                  step="any"
                  placeholder="126.9780"
                  className="coordinate-field"
                />
              </div>
            </div>
            <button
              className="manual-set-btn"
              onClick={handleManualInput}
            >
              📍 좌표로 설정
            </button>
          </div>
        </div>

        {/* 현재 설정된 위치 정보 */}
        {targetLocation && (
          <div className="current-location-info">
            <h4>현재 설정된 위치</h4>
            <div className="location-details">
              <p><strong>위도:</strong> {targetLocation.lat.toFixed(6)}</p>
              <p><strong>경도:</strong> {targetLocation.lng.toFixed(6)}</p>
              <p><strong>허용 반경:</strong> {radius}m</p>
              {locationName && <p><strong>위치 이름:</strong> {locationName}</p>}
            </div>
            
            <div className="location-actions">
              <button
                className="confirm-location-btn"
                onClick={handleLocationSet}
              >
                ✅ 이 위치로 설정 완료
              </button>
              <button
                className="reset-location-btn"
                onClick={resetLocation}
              >
                🔄 위치 초기화
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationSettings;

