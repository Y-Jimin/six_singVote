// src/pages/VotePage.jsx
import { useEffect, useState } from "react";
import "./VotePage.css";

function VotePage() {
  const [session, setSession] = useState(null);
  const [choice, setChoice] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [votingLocation, setVotingLocation] = useState(null);

  // 투표 위치 정보 가져오기
  useEffect(() => {
    fetch("http://localhost:5000/api/vote/location", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.location) {
          setVotingLocation(data.location);
        }
      })
      .catch((err) => {
        console.error('투표 위치 조회 오류:', err);
      });
  }, []);

  // 현재 활성화된 투표 세션 가져오기
  useEffect(() => {
    fetch("http://localhost:5000/api/vote/session/active", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setSession(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  // 사용자 위치 정보 가져오기
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.error('위치 정보 가져오기 오류:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5분
        }
      );
    }
  }, []);

  const handleSubmit = async () => {
    if (!choice) return alert("후보를 선택해주세요.");
    if (!userLocation) return alert("위치 정보를 가져올 수 없습니다. 위치 권한을 허용해주세요.");

    if (window.confirm(`정말 ${choice}번 후보에 투표하시겠습니까?\n\n한 번 투표하면 변경할 수 없습니다.`)) {
      setIsSubmitting(true);
      try {
        const res = await fetch("http://localhost:5000/api/vote/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            voteId: session._id,
            choice,
            userLat: userLocation.lat,
            userLng: userLocation.lng
          }),
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || '투표 제출에 실패했습니다.');
        }
        
        const data = await res.json();
        console.log('투표 제출 성공:', data);
        
        alert(`투표가 완료되었습니다!\n선택한 후보: ${data.candidateName}\n거리: ${data.distance.toFixed(1)}m`);
        setHasVoted(true);
        
      } catch (err) {
        console.error('투표 제출 오류:', err);
        alert(err.message || "투표 제출에 실패했습니다. 다시 시도해주세요.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="vote-loading-container">
        <div className="loading-spinner"></div>
        <p>투표 정보를 불러오는 중...</p>
      </div>
    );
  }

  // 진행중인 투표가 없는 경우
  if (!session || !session._id || session.message) {
    return (
      <div className="no-vote-container">
        <div className="no-vote-card">
          <div className="no-vote-icon">📊</div>
          <h2>진행중인 투표가 없습니다</h2>
          <p>현재 활성화된 투표 세션이 없습니다.</p>
          <p>관리자가 새로운 투표를 시작할 때까지 기다려주세요.</p>
          {votingLocation && (
            <div className="location-info">
              <p><strong>투표 장소:</strong> {votingLocation.name}</p>
              <p><strong>허용 반경:</strong> {votingLocation.radius}m</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (hasVoted) {
    return (
      <div className="voted-container">
        <div className="voted-card">
          <div className="voted-icon">✅</div>
          <h2>투표가 완료되었습니다!</h2>
          <p>선택하신 후보: <span className="selected-candidate">{choice}번</span></p>
          <p>소중한 한 표를 행사해주셔서 감사합니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="vote-container">
      <div className="vote-header">
        <div className="vote-title-section">
          <h1 className="vote-title">🎵 {session.title}</h1>
          <p className="vote-subtitle">원하는 후보를 선택하고 투표해주세요</p>
        </div>
        <div className="vote-status">
          <span className="status-badge">투표 진행중</span>
          {votingLocation && (
            <div className="location-badge">
              📍 {votingLocation.name}
            </div>
          )}
        </div>
      </div>

      {userLocation && votingLocation && (
        <div className="location-info-bar">
          <div className="location-status">
            <span className="status-indicator">📍</span>
            <span>현재 위치: {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}</span>
          </div>
          <div className="voting-location-info">
            <span>투표 장소: {votingLocation.name}</span>
            <span>허용 반경: {votingLocation.radius}m</span>
          </div>
        </div>
      )}

      <div className="vote-content">
        <div className="candidates-grid">
          {session.candidates.map((name, idx) => (
            <div
              key={idx}
              className={`candidate-card ${choice === idx + 1 ? 'selected' : ''}`}
              onClick={() => setChoice(idx + 1)}
            >
              <div className="candidate-number">{idx + 1}</div>
              <div className="candidate-name">{name}</div>
              <div className="candidate-selector">
                {choice === idx + 1 ? (
                  <div className="selected-indicator">✓</div>
                ) : (
                  <div className="select-indicator">선택</div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="vote-actions">
          <div className="choice-display">
            {choice ? (
              <div className="selected-choice">
                <span>선택한 후보: </span>
                <strong>{choice}번 - {session.candidates[choice - 1]}</strong>
              </div>
            ) : (
              <div className="no-choice">
                후보를 선택해주세요
              </div>
            )}
          </div>
          
          <button 
            className={`submit-vote-btn ${choice ? 'active' : 'disabled'}`}
            onClick={handleSubmit}
            disabled={!choice || isSubmitting || !userLocation}
          >
            {isSubmitting ? (
              <>
                <div className="submit-spinner"></div>
                투표 제출 중...
              </>
            ) : (
              '🗳️ 투표 제출하기'
            )}
          </button>
        </div>
      </div>

      <div className="vote-footer">
        <div className="vote-info">
          <p>💡 투표 안내</p>
          <ul>
            <li>한 번 투표하면 변경할 수 없습니다</li>
            <li>투표 전 신중하게 선택해주세요</li>
            <li>투표 결과는 실시간으로 집계됩니다</li>
            <li>투표는 행사장 내({votingLocation ? `${votingLocation.radius}m` : '설정된 거리'} 이내)에서만 가능합니다</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default VotePage;
