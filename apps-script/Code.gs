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
  // 반 전체가 같은 순간에 저장해도 행이 뒤섞이지 않도록 잠금
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
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

    // 방금 저장한 학생의 캐시만 무효화 → 본인은 즉시 반영
    invalidateStudentCache(data.classNum, data.studentNum, dateStr);

    return { success: true, message: '감정이 기록되었습니다! 😊' };
  } finally {
    lock.releaseLock();
  }
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

// ===== 캐시 헬퍼 =====
// 조회 결과를 CacheService에 잠시 저장해, 반 전체가 동시에 접속해도
// 시트를 매번 통째로 읽지 않도록 한다 (Apps Script 동시 실행 슬롯 고갈 방지).
var CACHE_TTL_RECORD = 600;    // 학생 기록: 10분 (본인 저장 시 즉시 무효화하므로 길게 잡아도 안전)
var CACHE_TTL_CLASS = 20;      // 교사 반별 조회: 20초 (거의 실시간이라 별도 무효화 불필요)
var CACHE_TTL_STUDENTS = 3600; // 학생 목록: 1시간 (거의 안 바뀜)

function cacheGet(key) {
  try {
    var v = CacheService.getScriptCache().get(key);
    return v ? JSON.parse(v) : null;
  } catch (e) {
    return null;
  }
}

function cachePut(key, obj, ttl) {
  try {
    var s = JSON.stringify(obj);
    // CacheService는 값당 약 100KB 제한 → 너무 크면 캐시하지 않고 그냥 반환
    if (s.length < 95000) {
      CacheService.getScriptCache().put(key, s, ttl);
    }
  } catch (e) {}
}

// 방금 저장한 학생의 캐시만 지운다 → 본인은 즉시 반영, 다른 학생 캐시는 유지
function invalidateStudentCache(classNum, studentNum, dateStr) {
  try {
    CacheService.getScriptCache().removeAll([
      'sr_' + classNum + '_' + studentNum + '_all',       // 전체 기록(레벨/뱃지)
      'sr_' + classNum + '_' + studentNum + '_' + dateStr // 오늘 요약/오늘 조회
    ]);
  } catch (e) {}
}

// 특정 날짜의 행만 시트 맨 아래에서부터 읽는다.
// 기록은 시간순으로 아래에 쌓이므로, 요청 날짜보다 과거 행을 만나면 즉시 중단
// → '오늘/최근' 조회 시 전체 행 수와 무관하게 읽는 양이 일정하다 (핵심 최적화).
function getRowsForDate(sheet, dateStr) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var BLOCK = 500;
  var out = [];
  var row = lastRow;
  var stop = false;
  while (row >= 2 && !stop) {
    var start = Math.max(2, row - BLOCK + 1);
    var num = row - start + 1;
    var block = sheet.getRange(start, 1, num, 9).getValues();
    for (var i = block.length - 1; i >= 0; i--) {
      var d = toDateString(block[i][1]);
      if (d < dateStr) { stop = true; break; }  // yyyy-MM-dd 문자열 비교 = 날짜 비교
      if (d === dateStr) out.push(block[i]);
    }
    row = start - 1;
  }
  out.reverse(); // 시간순(오름차순)으로 복원
  return out;
}

// ===== 기록 조회 (학생용) =====
function getRecords(params) {
  var dateKey = params.date ? String(params.date) : 'all';
  var cacheKey = 'sr_' + params.classNum + '_' + params.studentNum + '_' + dateKey;
  var cached = cacheGet(cacheKey);
  if (cached) return cached;

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('감정기록');

  var rows;
  if (params.date) {
    rows = getRowsForDate(sheet, String(params.date)); // 해당 날짜 행만 (빠름)
  } else {
    rows = sheet.getDataRange().getValues().slice(1);   // 전체 기록 (레벨/뱃지 계산용)
  }

  var records = [];
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (String(r[3]) === String(params.classNum) &&
        String(r[4]) === String(params.studentNum)) {
      records.push({
        timestamp: toTimestampString(r[0]),
        date: toDateString(r[1]),
        period: String(r[2]),
        emotion: String(r[6]),
        intensity: String(r[7]),
        memo: String(r[8])
      });
    }
  }

  var result = { success: true, records: records };
  cachePut(cacheKey, result, CACHE_TTL_RECORD);
  return result;
}

// ===== 반 전체 기록 조회 (교사용) =====
function getClassRecords(params) {
  var classKey = params.classNum ? String(params.classNum) : 'all';
  var dateKey = params.date ? String(params.date) : 'all';
  var cacheKey = 'cr_' + classKey + '_' + dateKey;
  var cached = cacheGet(cacheKey);
  if (cached) return cached;

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('감정기록');

  var rows;
  if (params.date) {
    rows = getRowsForDate(sheet, String(params.date)); // 해당 날짜 행만 (빠름)
  } else {
    rows = sheet.getDataRange().getValues().slice(1);   // 전체 기록
  }

  var records = [];
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    var matchClass = !params.classNum || String(r[3]) === String(params.classNum);
    if (matchClass) {
      records.push({
        timestamp: toTimestampString(r[0]),
        date: toDateString(r[1]),
        period: String(r[2]),
        classNum: String(r[3]),
        studentNum: String(r[4]),
        name: String(r[5]),
        emotion: String(r[6]),
        intensity: String(r[7]),
        memo: String(r[8])
      });
    }
  }

  var result = { success: true, records: records };
  cachePut(cacheKey, result, CACHE_TTL_CLASS);
  return result;
}

// ===== 학생 목록 조회 (교사용) =====
function getStudentList(params) {
  var classKey = params.classNum ? String(params.classNum) : 'all';
  var cacheKey = 'sl_' + classKey;
  var cached = cacheGet(cacheKey);
  if (cached) return cached;

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('학생목록');
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

  var result = { success: true, students: students };
  cachePut(cacheKey, result, CACHE_TTL_STUDENTS);
  return result;
}

// ===== 메뉴 추가 =====
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🎯 감정일기 설정')
    .addItem('📋 시트 초기화', 'setupSheet')
    .addToUi();
}
