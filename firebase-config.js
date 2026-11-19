/**
 * 운영 사이트에서는 Firebase 콘솔 > 프로젝트 설정 > 내 앱(웹)의 firebaseConfig 값을 넣으세요.
 * adminEmails에는 운영 권한을 가진 Google 계정만 추가하세요.
 * 반드시 firestore.rules의 관리자 이메일도 동일하게 변경해 게시해야 합니다.
 * firebase가 null이면 테스트/데모 모드이며 회원끼리 정보가 공유되지 않습니다.
 */
window.BROTHERS_CONFIG = {
  firebase: null,
  adminEmails: [""],
  // 설정 예시: firebase: { apiKey: "...", authDomain: "...firebaseapp.com", projectId: "...", appId: "..." }
  // 설정 예시: adminEmails: ["chairman@gmail.com", "treasurer@gmail.com"]
};
