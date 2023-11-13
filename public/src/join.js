$(document).ready(function () {

  $('#dupId').on('click', function () {
    dupId();
  });

  // 기존 코드와 함께 나머지 이벤트 핸들러 등록
  $('#dupNick').on('click', function () {
    dupNick();
  });
});

function register(){
  var userData = {
    id: $('#id').val(),
    password: $('#pw').val(),
    name: $('#name').val(),
    nickname: $('#nickname').val(),
    email: $('#email').val()
  };

  $.ajax({
    type: 'POST',
    url: '/register',
    data: userData,
    success: function (response) {
      alert('회원가입이 완료되었습니다.');
      window.location.href = '/login';
    },
    error: function (error) {
      alert('회원가입 중 오류가 발생했습니다.');
    }
  });
}
function checkSelectAll() {
  const checkboxes = document.querySelectorAll('input[name="chk"]');
  const checked = document.querySelectorAll('input[name="chk"]:checked');
  const selectAll = document.querySelector('input[name="selectall"]');

  if (checkboxes.length === checked.length) {
    selectAll.checked = true;
  } else {
    selectAll.checked = false;
  }
}

//체크박스 전체 = 개별 모두 자동
function selectAll(selectAll) {
  const checkboxes = document.getElementsByName('chk');

  checkboxes.forEach((checkbox) => {
    checkbox.checked = selectAll.checked
  })
}

// 체크누락시 창띄움
function fn_chk() {
  if (document.frm.selectall.checked == false) {
    alert("약관에 동의해주세요.");
    return false;
  }
  location.href = '/html.main.html';
}



/* 정규 */

/*변수 선언*/
var id = document.querySelector('#id');
var pw1 = document.querySelector('#pw');
var pw2 = document.querySelector('#pw2');
var userName = document.querySelector('#name');
var nickName = document.querySelector('#nickname');
var email = document.querySelector('#email');
var error = document.querySelectorAll('.error_box');

var dupIdCk = false;
var dupNickCk = false;
/*이벤트 핸들러 연결*/

id.addEventListener("keyup", checkId);
id.addEventListener("keyup", function(event) {
  if (event.key === "Enter") {
    checkId();
  }
});

pw1.addEventListener("keyup", checkPw);
pw1.addEventListener("keyup", function(event) {
  if (event.key === "Enter") {
    checkPw();
  }
});

pw2.addEventListener("keyup", comparePw);
pw2.addEventListener("keyup", function(event) {
  if (event.key === "Enter") {
    comparePw();
  }
});

userName.addEventListener("keyup", checkName);
userName.addEventListener("keyup", function(event) {
  if (event.key === "Enter") {
    checkName();
  }
});

nickName.addEventListener("keyup", checkNickName);
nickName.addEventListener("keyup", function(event) {
  if (event.key === "Enter") {
    checkNickName();
  }
});

email.addEventListener("keyup", checkEmail);
email.addEventListener("keyup", function(event) {
  if (event.key === "Enter") {
    checkEmail();
  }
});
/*콜백 함수*/

/*ID*/

function checkId() {
  var idPattern = /^[a-z0-9]{5,15}$/; // 정규식
  
  if (id.value.trim() === "") {
    error[0].style.display = "none";
    dupIdCk = false;
    return false;
  } else if (id.value.length < 5) {
    error[0].innerHTML = "5글자 이상 입력해주세요.";
    error[0].style.display = "block";
    error[0].style.color = "red";
    dupIdCk = false;
    return false;
  } else if (!idPattern.test(id.value)) {
    error[0].innerHTML = "사용하실 수 없는 아이디 입니다.";
    error[0].style.display = "block";
    error[0].style.color = "red";
    dupIdCk = false;
    return false;
  }else{
    error[0].innerHTML = "중복 확인을 눌러주세요.";
    error[0].style.display = "block";
    error[0].style.color = "red";
    dupIdCk = false;
    return true;
  }
}

function dupId(){

  if(!checkId()){
    return false;
  }
  var userId = $('#id').val();
  $.ajax({
    type: 'POST',
    url: '/checkId',
    data: { userId: userId },
    success: function (response) {
      if (response.isDuplicate) {
        error[0].innerHTML = "이미 사용 중인 아이디입니다.";
        error[0].style.display = "block";
        error[0].style.color = "red";
        dupIdCk = false;
        return false;
      } else {
        error[0].innerHTML = "사용 가능한 아이디입니다.";
        error[0].style.color = "#08A600";
        dupIdCk = true;
        return true;
      }
    },
    error: function (error) {
      console.error('중복 확인 중 오류가 발생했습니다.');
    }
  });
}
function dupNick(){

  if(!checkNickName()){
    return false;
  }
  var nickname = $('#nickname').val();
  $.ajax({
    type: 'POST',
    url: '/checkNick',
    data: { nickname: nickname },
    success: function (response) {
      if (response.isDuplicate) {
        error[4].innerHTML = "이미 사용 중인 닉네임입니다.";
        error[4].style.display = "block";
        error[4].style.color = "red";
        dupNickCk = false;
        return false;
      } else {
        error[4].innerHTML = "사용 가능한 닉네임입니다.";
        error[4].style.color = "#08A600";
        dupNickCk = true;
        return true;
      }
    },
    error: function (error) {
      console.error('중복 확인 중 오류가 발생했습니다.');
    }
  });
}

function checkPw() {
  var pwPattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[~!@#$%^&*()_+|<>?:{}]).{8,30}$/;
  if (pw1.value.trim() === "") {
    error[1].style.display = "none";
    return false;
  } else if (!pwPattern.test(pw1.value)) {
    error[1].innerHTML = "사용하실 수 없는 비밀번호 입니다.";
    error[1].style.display = "block";
    error[1].style.color = "red";
    return false;
  } else {
    error[1].innerHTML = "사용가능한 비밀번호입니다.";
    error[1].style.color = "#08A600";
    return true;
  }
}

/*PW2*/
function comparePw() {
  if (pw2.value !== pw1.value) {
    error[2].innerHTML = "비밀번호가 일치하지 않습니다.";
    error[2].style.display = "block";
    error[2].style.color = "red";
    return false;
  } else if (pw2.value === pw1.value && pw2.value != "") {
    error[2].innerHTML = "비밀번호가 일치합니다.";
    error[2].style.color = "#08A600";
    error[2].style.display = "block";
    return true;
  }
}

/* NAME */
function checkName() {
  var namePattern = /[a-zA-Z가-힣]{2,}/;
  if (userName.value.trim() === "") {
    // 아무 메시지도 표시하지 않음
    error[3].style.display = "none";
    return false;
  } else if (!namePattern.test(userName.value) || userName.value.indexOf(" ") > -1) {
    error[3].innerHTML = "사용이 어려운 이름입니다.";
    error[3].style.display = "block";
    error[3].style.color = "red";
    return false;
  } else {
    error[3].innerHTML = "확인되었습니다.";
    error[3].style.color = "#08A600";
    error[3].style.display = "block";
    return true;
  }
}


/*NICKNAME*/
/*NICKNAME*/
function checkNickName() {
  var namePattern = /[a-zA-Z가-힣]{2,}/;
  if (nickName.value.trim() === "") {
    error[4].style.display = "none";
    dupNickCk = false;
    return false;
  } else if (!namePattern.test(nickName.value)) {
    error[4].innerHTML = "사용이 어려운 닉네임입니다.";
    error[4].style.display = "block";
    error[4].style.color = "red";
    dupNickCk = false;
    return false;
  }else{
    error[4].innerHTML = "중복 확인을 눌러주세요.";
    error[4].style.display = "block";
    error[4].style.color = "red";
    dupNickCk = false;
    return true;
  }
}


/*EMAIL*/
function checkEmail() {
  var emailPattern = /^[a-zA-Z0-9._-]{2,}@{1}[a-zA-Z0-9.-]{2,10}\.[a-zA-Z]{2,6}$/;
  if (email.value.trim() === "") {
    // 아무 메시지도 표시하지 않음
    error[5].style.display = "none";
    return false;
  } else if (!emailPattern.test(email.value)) {
    error[5].innerHTML = "올바르지 않은 이메일입니다.";
    error[5].style.display = "block";
    error[5].style.color = "red";
    return false;
  } else {
    error[5].innerHTML = "확인되었습니다.";
    error[5].style.color = "#08A600";
    error[5].style.display = "block";
    return true;
  }
}


function check() {

  if (!document.querySelector('input[name="selectall"]').checked) {
    alert("약관을 동의해주세요.");
    return false;
  }

  if (!dupIdCk) {
    id.focus();
    return false;
  }
  if (!checkPw()) {
    pw1.focus();
    return false;
  }
  if (!comparePw()) {
    pw2.focus();
    return false;
  }
  if (!checkName()) {
    userName.focus();
    return false;
  }
  if (!dupNickCk) {
    nickName.focus();
    return false;
  }

  if (!checkEmail()) {
    email.focus();
    return false;
  }

  register();

  return true;
}