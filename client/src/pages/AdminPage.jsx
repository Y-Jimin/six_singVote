// src/pages/AdminPage.jsx
import { useEffect, useState } from "react";
import "./AdminPage.css";
import LocationSettings from "../components/LocationSettings";

function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState("");
  const [candidates, setCandidates] = useState(["", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [voteResults, setVoteResults] = useState([]);
  const [voteSessions, setVoteSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [showLocationSettings, setShowLocationSettings] = useState(false);
  const [votingLocation, setVotingLocation] = useState(null);

  // 페이지 로드 시 관리자 인증 상태 확인
  useEffect(() => {
    checkAdminAuth();
  }, []);

  // 관리자 인증 상태 확인
  const checkAdminAuth = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/admin/check", { 
        credentials: "include" 
      });
      if (res.ok) {
        const data = await res.json();
        if (data.isAdmin) {
          setIsLoggedIn(true);
          fetchVoteSessions();
          fetchVotingLocation();
        }
      }
    } catch (err) {
      console.error("인증 상태 확인 오류:", err);
    }
  };

  // 로그인 처리
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      alert("비밀번호를 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password: password.trim() })
      });

      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        setIsLoggedIn(true);
        fetchVoteSessions();
        fetchVotingLocation();
        setPassword(""); // 비밀번호 입력 필드 초기화
      } else {
        const errorData = await res.json();
        alert(errorData.message || "로그인에 실패했습니다.");
      }
    } catch (err) {
      console.error("로그인 오류:", err);
      alert("로그인 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 투표 세션 목록 가져오기
  const fetchVoteSessions = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/vote/sessions", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setVoteSessions(data);
      }
    } catch (err) {
      console.error("투표 세션 조회 오류:", err);
    }
  };

  // 투표 세션 생성
  const createSession = async (e) => {
    e.preventDefault();
    if (!title.trim()) return alert("투표 제목을 입력해주세요.");
    
    const validCandidates = candidates.filter(c => c && c.trim());
    if (validCandidates.length < 2) return alert("후보자는 최소 2명 이상 입력해주세요.");

    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/vote/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: title.trim(),
          candidates: validCandidates
        })
      });

      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        setTitle("");
        setCandidates(["", ""]);
        fetchVoteSessions();
      } else {
        const errorData = await res.json();
        alert(errorData.message || "투표 세션 생성에 실패했습니다.");
      }
    } catch (err) {
      console.error("투표 세션 생성 오류:", err);
      alert("투표 세션 생성 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 후보자 추가
  const addCandidate = () => {
    setCandidates([...candidates, ""]);
  };

  // 후보자 제거
  const removeCandidate = (index) => {
    if (candidates.length > 2) {
      setCandidates(candidates.filter((_, i) => i !== index));
    }
  };

  // 후보자 입력값 변경
  const handleCandidateChange = (index, value) => {
    const newCandidates = [...candidates];
    newCandidates[index] = value;
    setCandidates(newCandidates);
  };

  // 투표 결과 조회
  const fetchResults = async (sessionId) => {
    try {
      console.log('투표 결과 조회 시작:', sessionId);
      const res = await fetch(`http://localhost:5000/api/vote/results/${sessionId}`, { credentials: "include" });
      
      if (res.ok) {
        const data = await res.json();
        console.log('투표 결과 조회 성공:', data);
        setVoteResults(data);
        setSelectedSession(voteSessions.find(s => s._id === sessionId));
        setShowResults(true);
      } else {
        const errorData = await res.json();
        console.error('투표 결과 조회 실패:', errorData);
        alert(errorData.message || "투표 결과 조회에 실패했습니다.");
      }
    } catch (err) {
      console.error("투표 결과 조회 오류:", err);
      alert("투표 결과 조회 중 오류가 발생했습니다.");
    }
  };

  // 투표 세션 종료
  const endSession = async (sessionId) => {
    if (!window.confirm("정말로 이 투표를 종료하시겠습니까?\n종료 후에는 수정할 수 없습니다.")) {
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/vote/session/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sessionId })
      });

      if (res.ok) {
        alert("투표가 성공적으로 종료되었습니다.");
        fetchVoteSessions();
        if (selectedSession && selectedSession._id === sessionId) {
          setShowResults(false);
          setSelectedSession(null);
        }
      } else {
        const errorData = await res.json();
        alert(errorData.message || "투표 종료에 실패했습니다.");
      }
    } catch (err) {
      console.error("투표 종료 오류:", err);
      alert("투표 종료 중 오류가 발생했습니다.");
    }
  };

  // 투표 세션 삭제
  const deleteSession = async (sessionId) => {
    if (!window.confirm("정말로 이 투표 세션을 삭제하시겠습니까?\n\n⚠️ 주의: 삭제된 투표는 복구할 수 없습니다.\n투표 결과 데이터도 함께 삭제됩니다.")) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/vote/session/${sessionId}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (res.ok) {
        alert("투표 세션이 성공적으로 삭제되었습니다.");
        fetchVoteSessions();
        if (selectedSession && selectedSession._id === sessionId) {
          setShowResults(false);
          setSelectedSession(null);
        }
      } else {
        const errorData = await res.json();
        alert(errorData.message || "투표 세션 삭제에 실패했습니다.");
      }
    } catch (err) {
      console.error("투표 세션 삭제 오류:", err);
      alert("투표 세션 삭제 중 오류가 발생했습니다.");
    }
  };

  // 차트 데이터 생성
  const generateChartData = () => {
    if (!selectedSession) return [];

    const candidateVotes = {};
    selectedSession.candidates.forEach((candidate, index) => {
      candidateVotes[index + 1] = 0;
    });

    // 투표 결과가 있을 때만 집계
    if (voteResults && voteResults.length > 0) {
      voteResults.forEach(result => {
        if (candidateVotes[result.choice] !== undefined) {
          candidateVotes[result.choice]++;
        }
      });
    }

    return Object.entries(candidateVotes).map(([choice, votes]) => ({
      choice: parseInt(choice),
      candidate: selectedSession.candidates[parseInt(choice) - 1],
      votes,
      percentage: voteResults.length > 0 ? ((votes / voteResults.length) * 100).toFixed(1) : 0
    }));
  };

  // 로그아웃
  const handleLogout = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/admin/logout", {
        method: "POST",
        credentials: "include"
      });

      if (res.ok) {
        setIsLoggedIn(false);
        setVoteResults([]);
        setVoteSessions([]);
        setSelectedSession(null);
        setShowResults(false);
        setVotingLocation(null);
        alert("로그아웃되었습니다.");
      } else {
        console.error("로그아웃 실패");
      }
    } catch (err) {
      console.error("로그아웃 오류:", err);
    }
  };

  // 결과 창 닫기
  const closeResults = () => {
    setShowResults(false);
    setSelectedSession(null);
    setVoteResults([]);
  };

  // 투표 위치 정보 가져오기
  const fetchVotingLocation = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/vote/location", { 
        credentials: "include" 
      });
      if (res.ok) {
        const data = await res.json();
        setVotingLocation(data.location);
      }
    } catch (err) {
      console.error("투표 위치 조회 오류:", err);
    }
  };

  // 투표 위치 설정
  const handleLocationSet = async (locationData) => {
    try {
      const res = await fetch("http://localhost:5000/api/vote/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(locationData)
      });

      if (res.ok) {
        const data = await res.json();
        setVotingLocation(locationData);
        setShowLocationSettings(false);
        alert("투표 장소 위치가 성공적으로 설정되었습니다!");
      } else {
        const errorData = await res.json();
        alert(errorData.message || "위치 설정에 실패했습니다.");
      }
    } catch (err) {
      console.error("위치 설정 오류:", err);
      alert("위치 설정 중 오류가 발생했습니다.");
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="admin-login-container">
        <div className="admin-login-card">
          <div className="admin-login-header">
            <h1>관리자 로그인</h1>
            <p>투표 시스템 관리자 페이지입니다</p>
          </div>
          <form className="admin-login-form" onSubmit={handleLogin}>
            <div className="input-group">
              <label>비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="login-btn">
              로그인
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (showResults && selectedSession) {
    const chartData = generateChartData();
    const totalVotes = voteResults.length;

    return (
      <div className="admin-container">
        <div className="admin-header">
          <h1>투표 결과 - {selectedSession.title}</h1>
          <div className="header-buttons">
            <button className="back-btn" onClick={closeResults}>
              ← 목록으로 돌아가기
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              로그아웃
            </button>
          </div>
        </div>

        <div className="admin-content">
          <div className="results-section">
            <div className="section-header">
              <div>
                <h2>투표 결과 차트</h2>
                <p>총 투표 수: {totalVotes}표</p>
                {selectedSession.status === 'finished' && (
                  <span className="session-status-note">(종료된 투표)</span>
                )}
              </div>
              {selectedSession.status === 'active' && (
                <button 
                  className="end-session-btn-large"
                  onClick={() => endSession(selectedSession._id)}
                >
                  🚫 투표 종료
                </button>
              )}
            </div>

            <div className="chart-container">
              {chartData.map((item) => (
                <div key={item.choice} className="chart-bar">
                  <div className="chart-label">
                    <span className="candidate-number">{item.choice}번</span>
                    <span className="candidate-name">{item.candidate}</span>
                  </div>
                  <div className="chart-bar-container">
                    <div 
                      className="chart-bar-fill"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                    <span className="chart-value">
                      {item.votes}표 ({item.percentage}%)
                    </span>
                  </div>
                </div>
              ))}
              {voteResults.length === 0 && (
                <div className="no-votes-message">
                  <p>아직 투표가 없습니다.</p>
                </div>
              )}
            </div>
          </div>

          <div className="voters-section">
            <div className="section-header">
              <h2>투표자 목록</h2>
              <p>{totalVotes}명의 투표자</p>
            </div>
            
            {voteResults.length > 0 ? (
              <div className="voters-table-container">
                <table className="voters-table">
                  <thead>
                    <tr>
                      <th>투표자</th>
                      <th>선택한 후보</th>
                      <th>투표 시간</th>
                    </tr>
                  </thead>
                  <tbody>
                    {voteResults.map((result) => (
                      <tr key={result._id}>
                        <td>
                          <div className="voter-info">
                            <span className="voter-name">{result.userId?.name || 'Unknown'}</span>
                            <span className="voter-email">{result.userId?.email || 'No email'}</span>
                          </div>
                        </td>
                        <td>
                          <span className="choice-badge">
                            {result.choice}번 - {selectedSession.candidates[result.choice - 1]}
                          </span>
                        </td>
                        <td>
                          {new Date(result.votedAt).toLocaleString('ko-KR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-voters">
                <p>아직 투표가 없습니다.</p>
                <p className="no-voters-subtitle">투표가 진행되면 여기에 투표자 정보가 표시됩니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>투표 관리 시스템</h1>
        <button className="logout-btn" onClick={handleLogout}>
          로그아웃
        </button>
      </div>

      <div className="admin-content">
        <div className="create-vote-section">
          <div className="section-header">
            <div>
              <h2>새 투표 생성</h2>
              <p>새로운 투표 세션을 만들어주세요</p>
            </div>
          </div>
          
          <form className="vote-form" onSubmit={createSession}>
            <div className="input-group">
              <label>투표 제목</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 2024년 학생회장 선거"
                required
              />
            </div>
            
            <div className="candidates-section">
              <label>후보자 목록</label>
              <div className="candidates-list">
                {candidates.map((candidate, index) => (
                  <div key={index} className="candidate-input-group">
                    <input
                      type="text"
                      value={candidate}
                      onChange={(e) => handleCandidateChange(index, e.target.value)}
                      placeholder={`${index + 1}번 후보자 이름`}
                      required
                    />
                    {candidates.length > 2 && (
                      <button
                        type="button"
                        className="remove-candidate-btn"
                        onClick={() => removeCandidate(index)}
                      >
                        제거
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="add-candidate-btn"
                onClick={addCandidate}
              >
                + 후보자 추가
              </button>
            </div>
            
            <button
              type="submit"
              className="create-vote-btn"
              disabled={isLoading}
            >
              {isLoading ? "생성 중..." : "투표 생성"}
            </button>
          </form>
        </div>

        {/* 위치 설정 섹션 */}
        <div className="location-settings-section">
          <div className="section-header">
            <div>
              <h2>📍 투표 장소 위치 설정</h2>
              <p>가요제 현장의 정확한 위치를 설정하여 외부 인원의 투표를 방지합니다</p>
            </div>
            <div className="location-header-actions">
              {votingLocation ? (
                <div className="current-location-display">
                  <span className="location-status-badge">✅ 위치 설정됨</span>
                  <button 
                    className="edit-location-btn"
                    onClick={() => setShowLocationSettings(true)}
                  >
                    ✏️ 위치 수정
                  </button>
                </div>
              ) : (
                <button 
                  className="set-location-btn"
                  onClick={() => setShowLocationSettings(true)}
                >
                  📍 위치 설정하기
                </button>
              )}
            </div>
          </div>
          
          {votingLocation && (
            <div className="location-summary">
              <div className="location-summary-item">
                <strong>위치 이름:</strong> {votingLocation.name}
              </div>
              <div className="location-summary-item">
                <strong>위도:</strong> {votingLocation.lat.toFixed(6)}
              </div>
              <div className="location-summary-item">
                <strong>경도:</strong> {votingLocation.lng.toFixed(6)}
              </div>
              <div className="location-summary-item">
                <strong>허용 반경:</strong> {votingLocation.radius}m
              </div>
              <div className="location-summary-item">
                <strong>설정일:</strong> {new Date(votingLocation.setAt).toLocaleString('ko-KR')}
              </div>
            </div>
          )}
        </div>

        <div className="results-section">
          <div className="section-header">
            <div>
              <h2>투표 세션 목록</h2>
              <p>생성된 투표 세션들을 관리하세요</p>
            </div>
            <button className="refresh-btn" onClick={fetchVoteSessions}>
              🔄 새로고침
            </button>
          </div>
          
          {voteSessions.length > 0 ? (
            <div className="sessions-grid">
              {voteSessions.map((session) => (
                <div key={session._id} className="session-card">
                  <div className="session-header">
                    <h3>{session.title}</h3>
                    <span className={`status-badge ${session.status}`}>
                      {session.status === 'active' ? '진행중' : '종료됨'}
                    </span>
                  </div>
                  <div className="session-info">
                    <p>후보자: {session.candidates.join(', ')}</p>
                    <p>생성일: {new Date(session.createdAt).toLocaleDateString('ko-KR')}</p>
                    {session.finishedAt && (
                      <p>종료일: {new Date(session.finishedAt).toLocaleDateString('ko-KR')}</p>
                    )}
                  </div>
                  <div className="session-actions">
                    <button
                      className="view-results-btn"
                      onClick={() => fetchResults(session._id)}
                    >
                      📊 결과 보기
                    </button>
                    {session.status === 'active' && (
                      <button
                        className="end-session-btn"
                        onClick={() => endSession(session._id)}
                      >
                        🚫 종료
                      </button>
                    )}
                    {session.status === 'finished' && (
                      <button
                        className="delete-session-btn"
                        onClick={() => deleteSession(session._id)}
                      >
                        🗑️ 삭제
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-sessions">
              <p>아직 생성된 투표 세션이 없습니다.</p>
            </div>
          )}
          
          {/* 모든 투표가 종료되었을 때 안내 */}
          {voteSessions.length > 0 && voteSessions.every(session => session.status === 'finished') && (
            <div className="all-sessions-finished">
              <div className="finished-notice">
                <div className="finished-icon">🏁</div>
                <h3>모든 투표가 종료되었습니다</h3>
                <p>현재 진행 중인 투표가 없습니다.</p>
                <p>새로운 투표를 생성하거나 기존 투표 결과를 확인해보세요.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 위치 설정 모달 */}
      {showLocationSettings && (
        <div className="modal-overlay" onClick={() => setShowLocationSettings(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📍 투표 장소 위치 설정</h2>
              <button 
                className="modal-close-btn"
                onClick={() => setShowLocationSettings(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <LocationSettings
                onLocationSet={handleLocationSet}
                currentLocation={votingLocation}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPage;
