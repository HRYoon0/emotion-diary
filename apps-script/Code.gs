/**
 * 감정일기 - Google Apps Script 백엔드
 *
 * 사용법:
 * 1. Google Sheets에서 [확장 프로그램] > [Apps Script] 클릭
 * 2. 이 코드를 붙여넣기
 * 3. [배포] > [새 배포] > 웹 앱 선택
 * 4. "액세스 권한이 있는 사용자: 모든 사용자" 설정
 * 5. 배포 후 URL을 복사하여 프론트엔드에 설정
 */

// ===== 시트 초기화 =====
function setupSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 감정기록 시트
  var recordSheet = ss.getSheetByName('감정기록');
  if (!recordSheet) {
    recordSheet = ss.insertSheet('감정기록');
  }
  recordSheet.clear();
  var headers = ['타임스탬프', '날짜', '교시', '반', '번호', '이름', '감정', '감정강도', '메모'];
  recordSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  recordSheet.getRange(1, 1, 1, headers.length)
    .setBackground('#4A90D9')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold');
  recordSheet.setFrozenRows(1);

  // 열 너비 설정
  recordSheet.setColumnWidth(1, 160); // 타임스탬프
  recordSheet.setColumnWidth(2, 110); // 날짜
  recordSheet.setColumnWidth(3, 60);  // 교시
  recordSheet.setColumnWidth(4, 60);  // 반
  recordSheet.setColumnWidth(5, 60);  // 번호
  recordSheet.setColumnWidth(6, 80);  // 이름
  recordSheet.setColumnWidth(7, 100); // 감정
  recordSheet.setColumnWidth(8, 80);  // 감정강도
  recordSheet.setColumnWidth(9, 200); // 메모

  // 학생목록 시트
  var studentSheet = ss.getSheetByName('학생목록');
  if (!studentSheet) {
    studentSheet = ss.insertSheet('학생목록');
  }
  studentSheet.clear();
  var studentHeaders = ['반', '번호', '이름', '비밀번호'];
  studentSheet.getRange(1, 1, 1, studentHeaders.length).setValues([studentHeaders]);
  studentSheet.getRange(1, 1, 1, studentHeaders.length)
    .setBackground('#27AE60')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold');
  studentSheet.setFrozenRows(1);

  // 예시 학생 데이터 (필요에 따라 수정)
  var sampleStudents = [
    ['1', '1', '김민준', '1234'],
    ['1', '2', '이서연', '1234'],
    ['1', '3', '박지호', '1234'],
    ['1', '4', '최수아', '1234'],
    ['1', '5', '정도윤', '1234'],
  ];
  studentSheet.getRange(2, 1, sampleStudents.length, 4).setValues(sampleStudents);

  // 교사비밀번호 시트
  var teacherSheet = ss.getSheetByName('교사설정');
  if (!teacherSheet) {
    teacherSheet = ss.insertSheet('교사설정');
  }
  teacherSheet.clear();
  teacherSheet.getRange(1, 1, 1, 2).setValues([['설정', '값']]);
  teacherSheet.getRange(1, 1, 1, 2)
    .setBackground('#E74C3C')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold');
  teacherSheet.getRange(2, 1, 1, 2).setValues([['교사비밀번호', 'teacher2024']]);
  teacherSheet.setFrozenRows(1);

  SpreadsheetApp.getUi().alert('시트 초기화 완료!\n\n학생목록 시트에 학생 정보를 입력해주세요.\n교사설정 시트에서 비밀번호를 변경해주세요.');
}

// ===== 웹 요청 처리 =====
function doGet(e) {
  var action = e.parameter.action;
  var result;

  try {
    switch (action) {
      case 'login':
        result = handleLogin(e.parameter);
        break;
      case 'teacherLogin':
        result = handleTeacherLogin(e.parameter);
        break;
      case 'getRecords':
        result = getRecords(e.parameter);
        break;
      case 'getClassRecords':
        result = getClassRecords(e.parameter);
        break;
      case 'getStudentList':
        result = getStudentList(e.parameter);
        break;
      default:
        result = { success: false, message: '알 수 없는 요청입니다.' };
    }
  } catch (err) {
    result = { success: false, message: '오류 발생: ' + err.message };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var action = data.action;
  var result;

  try {
    switch (action) {
      case 'saveEmotion':
        result = saveEmotion(data);
        break;
      default:
        result = { success: false, message: '알 수 없는 요청입니다.' };
    }
  } catch (err) {
    result = { success: false, message: '오류 발생: ' + err.message };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ===== 로그인 =====
function handleLogin(params) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('학생목록');
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(params.classNum) &&
        String(data[i][1]) === String(params.studentNum) &&
        String(data[i][3]) === String(params.password)) {
      return {
        success: true,
        student: {
          classNum: String(data[i][0]),
          studentNum: String(data[i][1]),
          name: data[i][2]
        }
      };
    }
  }

  return { success: false, message: '반, 번호, 비밀번호를 확인해주세요.' };
}

function handleTeacherLogin(params) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('교사설정');
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === '교사비밀번호' && String(data[i][1]) === String(params.password)) {
      return { success: true };
    }
  }

  return { success: false, message: '교사 비밀번호가 틀렸습니다.' };
}

// ===== 감정 저장 =====
function saveEmotion(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('감정기록');

  var now = new Date();
  var timestamp = Utilities.formatDate(now, 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
  var dateStr = Utilities.formatDate(now, 'Asia/Seoul', 'yyyy-MM-dd');

  var row = [
    timestamp,
    dateStr,
    data.period || '',
    data.classNum,
    data.studentNum,
    data.name,
    data.emotion,
    data.intensity || '',
    data.memo || ''
  ];

  sheet.appendRow(row);

  return { success: true, message: '감정이 기록되었습니다! 😊' };
}

// ===== 날짜 변환 헬퍼 (Date 객체 → yyyy-MM-dd 문자열) =====
function toDateString(val) {
  if (val instanceof Date) {
    return Utilities.formatDate(val, 'Asia/Seoul', 'yyyy-MM-dd');
  }
  return String(val);
}

function toTimestampString(val) {
  if (val instanceof Date) {
    return Utilities.formatDate(val, 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
  }
  return String(val);
}

// ===== 기록 조회 (학생용) =====
function getRecords(params) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('감정기록');
  var data = sheet.getDataRange().getValues();

  var records = [];
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][3]) === String(params.classNum) &&
        String(data[i][4]) === String(params.studentNum)) {
      var rowDate = toDateString(data[i][1]);
      if (params.date && rowDate !== String(params.date)) {
        continue;
      }
      records.push({
        timestamp: toTimestampString(data[i][0]),
        date: rowDate,
        period: String(data[i][2]),
        emotion: String(data[i][6]),
        intensity: String(data[i][7]),
        memo: String(data[i][8])
      });
    }
  }

  return { success: true, records: records };
}

// ===== 반 전체 기록 조회 (교사용) =====
function getClassRecords(params) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('감정기록');
  var data = sheet.getDataRange().getValues();

  var records = [];
  for (var i = 1; i < data.length; i++) {
    var rowDate = toDateString(data[i][1]);
    var matchClass = !params.classNum || String(data[i][3]) === String(params.classNum);
    var matchDate = !params.date || rowDate === String(params.date);

    if (matchClass && matchDate) {
      records.push({
        timestamp: toTimestampString(data[i][0]),
        date: rowDate,
        period: String(data[i][2]),
        classNum: String(data[i][3]),
        studentNum: String(data[i][4]),
        name: String(data[i][5]),
        emotion: String(data[i][6]),
        intensity: String(data[i][7]),
        memo: String(data[i][8])
      });
    }
  }

  return { success: true, records: records };
}

// ===== 학생 목록 조회 (교사용) =====
function getStudentList(params) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('학생목록');
  var data = sheet.getDataRange().getValues();

  var students = [];
  for (var i = 1; i < data.length; i++) {
    var matchClass = !params.classNum || String(data[i][0]) === String(params.classNum);
    if (matchClass) {
      students.push({
        classNum: String(data[i][0]),
        studentNum: String(data[i][1]),
        name: data[i][2]
      });
    }
  }

  return { success: true, students: students };
}

// ===== 메뉴 추가 =====
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🎯 감정일기 설정')
    .addItem('📋 시트 초기화', 'setupSheet')
    .addToUi();
}
