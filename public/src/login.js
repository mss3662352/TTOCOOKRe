$(function () {
  const originalIdIconSrc = '/img/original_id.png';
  const originalPWIconSrc = '/img/original_pw.png';

  $('#id').focus(function () {
    $('.id_icon').attr('src', '/img/id.png');
  });

  $('#id').blur(function () {
    $('.id_icon').attr('src', '/img/id_off.png');
  });

  $('#pw').focus(function () {
    $('.pw_icon').attr('src', '/img/pw.png');
  });

  $('#pw').blur(function () {
    $('.pw_icon').attr('src', '/img/pw_off.png');
  });
});



document.addEventListener('DOMContentLoaded', function () {
  const inputJsElements = document.querySelectorAll('.input_js');

  inputJsElements.forEach(function (inputJsElement) {
    const inputNoElement = inputJsElement.nextElementSibling;

    inputJsElement.addEventListener('input', function () {
      if (inputJsElement.value.trim() !== '') {
        inputNoElement.style.display = 'block';
      } else {
        inputNoElement.style.display = 'none';
      }
    });

    inputNoElement.addEventListener('click', function () {
      inputJsElement.value = '';
      inputNoElement.style.display = 'none';
    });
  });
});


document.getElementById('login_btn').addEventListener('click', check);

var id = $('#id');
var pw = $('#pw');


function check() {

  if (id.val() === "" || pw.val() === "") {
    if (id.val() === "") {
      alert("아이디를 입력해주세요.");
      id.focus();
    } else if (pw.val() === "") {
      alert("비밀번호를 입력해주세요.");
      pw.focus();
    }
    return false;
  } else {
    $.ajax({
      type: 'POST',
      url: '/userLogin', 
      data: {
        id: id.val(),
        pw: pw.val()
      },
      success: function (response) {
        if (response.success) {
          alert("로그인 되었습니다.");
          location.href = '/';
        } else {
          alert("로그인 실패." + response.message);
        }
      },
      error: function (xhr, status, error) {
        // 401 Unauthorized 오류 처리
        if (xhr.status === 401) {
          alert("로그인 실패. 아이디와 비밀번호를 확인해주세요.");
          console.error('로그인 실패. 서버 응답:', xhr.responseText);
        } else {
          console.error('로그인 중 오류가 발생했습니다.');
        }
      }
    });

    return true;
  }
}