// Public identifiers only. Populate later for an independent V3 staging project.
const R1V3_COMMON={
 localMode:false,appsScriptUrl:"https://script.google.com/macros/s/AKfycbwPQ-bsT8M_HKr5BefYRrty8S72e2k4btKT9_rzN7rrw1xbcQvGJd1aUBPtnZc28i4zHg/exec",firebaseDatabaseUrl:"https://r1v3-mates-261015-e8e4ad-default-rtdb.europe-west1.firebasedatabase.app",firebaseProjectId:"r1v3-mates-261015-e8e4ad",firebaseWebApiKey:"AIzaSyBAZx2UFJs89TYoO4qe1kpgXijfIaliTwY",
 firebaseEnabled:true,firebaseFirstEnabled:false,firebaseRoot:'gamificacio-reforc-v3',groupId:'GRUP-1ESO-REFORC-V3',schemaMode:'V3',
 defaultTrimester:1,themeByTrimester:{1:'space',2:'city',3:'expedition'},focusSessionMinutes:55,liveDisconnectMs:90000,liveHeartbeatMs:15000,liveAnswerDebounceMs:900,liveTtlHours:72,maxAnswerChars:12000,reportRecommendationDays:21,reportRecommendationMinErrors:5,classControlPollMs:12000,version:'3.1.0-fase6b',demoProjectRequired:true
};
const R1V3_DEMO_TARGET={"appsScriptUrl":"https://script.google.com/macros/s/AKfycbz8QWNw1poXMsn1JRmKe3eN3ba5twSJcO_2dls1k7rP_cSJXQEkxvQ2eVIR36lemkBFzg/exec","firebaseDatabaseUrl":"https://r1v3-demo-261015-e8e4ad-default-rtdb.europe-west1.firebasedatabase.app","firebaseProjectId":"r1v3-demo-261015-e8e4ad","firebaseWebApiKey":"AIzaSyBX4QVfwomsfzEtvvoz3CbPWxE0cBUmoYs"};
const R1V3_DEMO_PAGE=new URLSearchParams(location.search).get('demo')==='1'||location.pathname.endsWith('/demo.html')||location.pathname.endsWith('/demo-geometria.html');
window.GAMIFICACIO_CONFIG=Object.freeze({...R1V3_COMMON,...(R1V3_DEMO_PAGE?R1V3_DEMO_TARGET:{}),isDemoProject:R1V3_DEMO_PAGE});
