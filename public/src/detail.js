$(document).ready(function(){
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const recipeId = urlParams.get('id');

  $('[name="reply_img"]').on("change", imgFile_reply);
  
  getDetail(recipeId);
  getRecipeReply(recipeId);

  //댓글 작성
  $(document).on("click", '#reply_button', function(){
    const commentContent = $('#myComment')
    if (!commentContent.val().trim()) {
      alert('댓글란이 비어 있습니다.');
      commentContent.focus();
      return;
    } 
    insertReply(recipeId);
  })
  //대댓글 작성
  $(document).on("click", '.reply-btn', function(){
    const parentReplyId = $(this).data('parent-id');
    insertReply(recipeId, parentReplyId);
  });

  $(document).on("click", '.comment_sub', function() {
    const clickedCommentItem = $(this).closest('li');
    const parent_id = clickedCommentItem.next('.answer_wrap').data('parent-id');
    commentSub(parent_id);
  });

  $(document).on("click", '.write_review', writeReview);
  // .photo_swiper .swiper-slide 클릭 시 이벤트 핸들러
  $(document).on("click", '.photo_swiper .swiper-slide', openModal);
  // .modal_close 버튼 클릭 시 이벤트 핸들러
  $(document).on("click", '.modal_close', closeModal);
})

//댓글 저장
function insertReply(recipeId, parentReplyId = null){
  const formData = new FormData();
  const replyFile = $('[name="reply_img"]')[0].files[0];
  const replyPicture = replyFile ? replyFile : '';
  if (parentReplyId) {
    formData.append('picture', null);
    formData.append('rating', null);
    formData.append('content', $('textarea[name="rerecomment"]').val());
  } else {
      formData.append('picture', replyPicture);
      formData.append('rating', $('input[name="rating"]').val());
      formData.append('content', $('textarea[name="mycomment"]').val());
  }
  formData.append('recipeId', recipeId);
  formData.append('parentReplyId', parentReplyId);

  $.ajax({
    type: 'POST',
    url: '/insert_reply',
    data: formData,
    contentType: false,
    processData: false,
    success: function (response) {
      if (response.success) {
        alert('댓글 등록 완료');
        getDetail(recipeId);
        getRecipeReply(recipeId);

        // 파일 업로드 필드 초기화
        $('[name="reply_img"]').val(null);

        // 텍스트 에어리어 초기화
        if (parentReplyId) {
            $('textarea[name="rerecomment"]').val('');
        } else {
            $('textarea[name="mycomment"]').val('');
        }
    } else {
        alert(response.message);
    }
    },
    error: function (error) {
        console.error('insert_recipe Ajax 오류:', error);
    },
  });
}

function getDetail(recipeId){
    $.ajax({
      url: '/getDetail',
      method: 'GET',
      data: { id: recipeId },
      dataType: 'json',
      success: function (data) {
          renderRecipeDetails(data);
      },
      error: function (error) {
          console.error('Error fetching recipe details:', error);
      }
  });
}

function getRecipeReply(recipeId){
  $.ajax({
    url: '/getRecipeReply',
    method: 'GET',
    data: { id: recipeId },
    dataType: 'json',
    success: function (data) {
        renderRecipeReply(data);
        renderSwiper(data);
    },
    error: function (error) {
        console.error('Error fetching recipe reply:', error);
    }
  });
}

function renderRecipeDetails(data) {
  const recipeDetails = {
    beauty: data.recipe.beauty,
    title: data.recipe.title,
    level: data.recipe.level,
    time: data.recipe.time,
    nickname: data.recipe.nickname,
    thumbnail: data.recipe.thumbnail,
    introduction: data.recipe.introduction,
    ingre_tip: data.recipe.ingre_tip,
    tip: data.recipe.tip,
    ingredients: data.ingredients, // 재료 정보
    steps: data.steps, // 단계 정보
    
  };

  // 각 엘리먼트에 데이터를 채워넣기
  var thumbnailPath = recipeDetails.thumbnail ? recipeDetails.thumbnail.replace('\public', '') : '';
  var level = convertLevelToText(recipeDetails.level)
  $('[name="beauty"]').text(recipeDetails.beauty);
  $('[name="title"]').text(recipeDetails.title);
  $('[name="level"]').text(level);
  $('[name="time"]').text(recipeDetails.time + '분');
  $('[name="nickname"]').text(recipeDetails.nickname);
  $('[name="thumbnail"]').attr('src', thumbnailPath);
  $('[name="introduction"]').text(recipeDetails.introduction);
  $('[name="ingre_tip"]').text(recipeDetails.ingre_tip);
  $('[name="tip_des"]').text(recipeDetails.tip)
  // 재료 리스트를 채워넣기
  const ingreList = $('.ingre_list');
  ingreList.empty(); // 기존 내용 비우기

  recipeDetails.ingredients.forEach(function (ingredient) {
      const ingreItem = `<li>
          <p>${ingredient.name}</p>
          <span>${ingredient.amount}</span>
      </li>`;
      ingreList.append(ingreItem);
  });

  const stepList = $('.recipe_list');
  stepList.empty(); // 기존 내용 비우기

  recipeDetails.steps.forEach(function (step) {
    const stepPicture = step.picture ? step.picture.replace('\public', '') : '';
    const stepContent = step.content
    const stepItem = `<li>
                        <div class="recipe_img">
                          <img src="${stepPicture}" alt="레시피">
                        </div>
                        <div class="recipe_detail_des">
                          <h2>Step ${step.ord}</h2>
                          <p>
                            ${stepContent}
                          </p>
                        </div>
                      </li>`;
    stepList.append(stepItem);
  });

  // // 예시: 찜 여부에 따라 이미지 변경
  // const pickImage = $('#pickImage');
  // if (data[0].isPicked) {
  //     pickImage.attr('src', '../img/picked.png');
  // } else {
  //     pickImage.attr('src', '../img/pick.png');
  // }
}

function renderRecipeReply(data){
  const topLevelReplies = data.topLevelReplies;
  const childReplies = data.childReplies;
  let ratingSum = 0;
  let ratingIndex = 0;
  const commentList = $('.comment_list');
  commentList.empty(); // 기존 내용 비우기

  // 각 댓글을 순회하며 dom 생성
  topLevelReplies.forEach(function(reply){
    const isCurrentUser = reply.user_id === data.sessionUserId;
    ratingSum += parseInt(reply.rating);
    ratingIndex++;
    const childReplyCount = getChildReplyCount(childReplies, reply.id);

    const commentItem = `
      <li>
        <div>
          <div>
            <div class="comment_name">
              <div class="name_img_wrap">
                <div class="name_img">
                  <img src="/img/mypage(detail).png" alt="">
                </div>
                <p>${reply.nickname}</p>
                <ul>
                ${generateStarRating(reply.rating/2)}
                </ul>
              </div>
              <span>${reply.updated_at ? reply.updated_at+'(수정 됨)' : reply.created_at}</span>
            </div>
            <p class="comment_main">
              ${reply.content}
            </p>
          </div>
          <div class="comment_icon">
            <div>
              <div class="comment_pick">
                <img id="pickImage" src="/img/pick.png" alt="">
                <span>0</span>
              </div>
              <div class="comment_sub">
                <img src="/img/comment.png" alt="">
                <span>${childReplyCount}</span>
              </div>
            </div>
            <div class="answer_btn">
              ${isCurrentUser ? `<button>수정</button><button>삭제</button>` : ''}
            </div>
          </div>
        </div>
        <div class="comment_photo">
        ${reply.picture !== null && reply.picture !== '' ? `<img src="${reply.picture.replace('\public', '')}" alt="">` : ''}
        </div>
      </li>
      ${renderChildReplies(childReplies, reply.id, data)}
      
    `;
    commentList.append(commentItem);
    // const moreComment = 
    //   `<div class="more_comment">
    //     <button>댓글 더보기</button>
    //   </div>`
    // commentList.append(moreComment);
  });
  $('.star_review_avg').empty();
  // 새로운 평점 요소 추가
  let starRating = 0;
  starRating = (ratingSum/ratingIndex/2).toFixed(2)
  $('.star_review_avg').append(starRating > 0 ? generateStarRating(starRating) : generateStarRating(0))
  .append('<li style="width: 100px;"><span class="star_number" style="color: #999; font-size: 12px;">')
  $('.star_number').text( starRating > 0 ? '('+starRating+')' :'('+ 0 +')')
  $('.review_count').text('('+ratingIndex+')')
}

function renderChildReplies(childReplies, parentId, data) {
  const filteredChildReplies = childReplies.filter(reply => reply.parent_reply_id === parentId);
  if (!filteredChildReplies || filteredChildReplies.length === 0) {
    return `<div class="answer_wrap" data-parent-id="${parentId}">${renderReplyForm(parentId, data)}</div>`;
  }

  const childReplyItems = filteredChildReplies.map(childReply => {
    const isCurrentUser = data.sessionUserId === childReply.user_id;
    return `
        <div class="answer">
          <div class="answer_title">
            <div>
              <div class="title_img">
                <img src="/img/mypage(detail).png" alt="">
              </div>
              <p>${childReply.nickname}</p>
            </div>
            <span>${childReply.updated_at ? childReply.updated_at + '(수정 됨)' : childReply.created_at}</span>
          </div>
          <p>${childReply.content}</p>
          <div>
            ${isCurrentUser ? `<button class="edit-btn">수정</button> <button class="delete-btn">삭제</button>` : ''}
          </div>
        </div>
      `;
  }).join('');

  return `<div class="answer_wrap" data-parent-id="${parentId}">${childReplyItems}${renderReplyForm(parentId, data)}</div>`;
}
function renderReplyForm(parentId, data) {
  const userSession = data.userSession;
  return `
    <div class="answer_write">
      <div class="answer_write_inner">
        <p>${ userSession ? userSession.nickname :'로그인 해주세요 :)'}</p>
        <div>
          <textarea maxlength="120" name="rerecomment" cols="30" rows="10" placeholder="타인을 배려 하는 마음을 담아 댓글을 달아주세요."></textarea>
          <button class="reply-btn" data-parent-id="${parentId}">등록</button>
        </div>
      </div>
    </div>
  `;
}

// 대댓글 개수를 가져오는 함수
function getChildReplyCount(childReplies, parentId) {
  return childReplies.filter(reply => reply.parent_reply_id === parentId).length;
}

function renderSwiper(data){
  const replies = data.topLevelReplies;
  const photoSwiper = $('.photo_swiper .swiper-wrapper');
  const modalSwiper = $('.modalSwiper .swiper-wrapper')
  const modal2Swiper = $('.modalSwiper2 .swiper-wrapper');
  photoSwiper.empty(); // 기존 내용 비우기
  modalSwiper.empty();
  modal2Swiper.empty();

  let pictureIndex = 0;
  replies.forEach(function (reply){
    if (reply.picture !== '' && reply.picture !== null) {
      pictureIndex ++;
      const pictureItem = `
        <div class="swiper-slide">
          <img src="${reply.picture.replace('\public', '')}" alt="">
        </div>`;
      photoSwiper.append(pictureItem);
      modalSwiper.append(pictureItem);
    }
  });
  replies.forEach(function (reply){
    if (reply.picture !== '' && reply.picture !== null) {
      const modalItem =`
      <div class="swiper-slide">
        <img src="${reply.picture.replace('\public', '')}" />
        <div class="modal_contents">
          <div class="modal_contents_title">
            <img src="/img/mypage(detail).png" alt="">
            <p>${reply.nickname}</p>
          </div>
          <p class="modal_contents_des">
            ${reply.content}
          </p>
        </div>
      </div>`
      modal2Swiper.append(modalItem);
    }
  });
  $('.photo_btn_wrap span').text(pictureIndex);
  
  /* COMMENT */
  var swiper1 = new Swiper(".photo_swiper", {
    slidesPerView: 6,
    spaceBetween: "8px",
    slidesPerGroup: 1,
    loop: true,
    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev",
    },
  });
  /* 모달 스와이퍼 */
  var swiper2 = new Swiper(".modalSwiper", {
    loop: true,
    spaceBetween: 10,
    slidesPerView: 7,
    freeMode: true,
    watchSlidesProgress: true,
  });
  var swiper3 = new Swiper(".modalSwiper2", {
    loop: true,
    spaceBetween: 10,
    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev",
    },
    thumbs: {
      swiper: swiper2
    },
  });
  var photo_swiper = document.querySelector('.photo_swiper').swiper;
  // photo_swiper의 각 슬라이드에 클릭 이벤트 리스너 연결
  photo_swiper.slides.forEach(function (slide, index) {
    slide.addEventListener('click', function () {
      // 클릭한 슬라이드의 인덱스에 해당하는 다른 Swiper로 이동
      swiper2.slideTo(index);
      swiper3.slideTo(index);
    });
  });
}


function generateStarRating(star) {
  
  // 주어진 별점을 2로 나누어 채워진 별과 반 별의 개수를 계산
  const fullStarCount = Math.floor(star);
  const remainder = star % 1;
  const halfStarCount = Math.floor(remainder * 2); // 반 별은 0.25당 0.5로 계산

  // 이미지 경로
  const emptyStarPath = '/img/star.png';
  const halfStarPath = '/img/star_half.png';
  const fullStarPath = '/img/star_fill.png';

  // 생성된 별점 이미지를 담을 배열
  const starImages = [];
  if(!star){
    for (let i = 0; i < 5; i++) {
      starImages.push(`<li><img src="${emptyStarPath}" alt=""></li>`)
    }
    return starImages.join('');
  }
  // 채워진 별 이미지 추가
  for (let i = 0; i < fullStarCount; i++) {
    starImages.push(`<li><img src="${fullStarPath}" alt=""></li>`);
  }

  // 반 별 이미지 추가
  if (halfStarCount > 0) {
    starImages.push(`<li><img src="${halfStarPath}" alt=""></li>`);
  }

  // 비어있는 별 이미지 추가
  const emptyStarCount = 5 - fullStarCount - halfStarCount;
  for (let i = 0; i < emptyStarCount; i++) {
    starImages.push(`<li><img src="${emptyStarPath}" alt=""></li>`);
  }

  // 생성된 별점 이미지를 문자열로 반환
  return starImages.join('');
}

function imgFile_reply(e){
	$('#reply_img').remove();
	$('#callReply').remove();
    $('.my_comment .addPic').css('display','none');
	var files = e.target.files;
	var filesArr = Array.prototype.slice.call(files);
	
    if (filesArr.length === 0) {
        $('.my_comment .addPic').css('display', 'block');
      }

	filesArr.forEach(function(f){
		
		/*확장자검사*/
		if(!f.type.match('image.*')){
			alert('이미지파일만 업로드 가능합니다.');
            $('.my_comment .addPic').css('display', 'block');
			return;
		}
		sel_file = f;
		var reader = new FileReader();
		reader.onload = function(e){
			var img = $('<img id="reply_img" alt="사용자 이미지" >');
			$('#reply_area').append(img);
			$('#reply_img').attr("src", e.target.result);
		}
		reader.readAsDataURL(f);
	});
}


function convertLevelToText(level) {
  switch (level) {
      case 'A':
          return '초급';
      case 'B':
          return '중급';
      case 'C':
          return '고급';
      default:
          return level;
  }
}


//

window.addEventListener('scroll', function () {

  // const ingreElement = document.querySelector('.ingre');

  // const isScrolledIntoView = isInView(ingreElement);

  // const ingreListWrap = document.querySelector('.ingre');
  // ingreListWrap.style.opacity = isScrolledIntoView ? 1 : 0;
});

/* function isInView(element) {
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;

  const verticalCenter = windowHeight / 2;
  const horizontalCenter = windowWidth / 2;

  return rect.top <= verticalCenter && rect.bottom >= verticalCenter &&
    rect.left <= horizontalCenter && rect.right >= horizontalCenter;
}
 */


/* PICK */
function togglePick() {
  const pickButton = $('.pick > img');
  const pickImage = $('#pickImage');
  const currentSrc = pickImage.attr('src');

  if (currentSrc.includes('pick.png')) {
    pickImage.attr('src', currentSrc.replace('pick.png', 'pick_red.png'));
  } else if (currentSrc.includes('pick_red.png')) {
    pickImage.attr('src', currentSrc.replace('pick_red.png', 'pick.png'));
  }

  pickButton.toggleClass('clicked');

  setTimeout(() => {
    pickButton.toggleClass('clicked');
  }, 200);
}


function openModal() {
  $('.photo_detail_modal_wrap').css('display', 'block').css('transform', 'translateY(0)');
  $('body').css('overflow', 'hidden');
}

function closeModal() {
  $('.photo_detail_modal_wrap').css('transform', 'translateY(100%)');
  setTimeout(function () {
    $('.photo_detail_modal_wrap').css('display', 'none');
    $('body').css('overflow', 'auto');
  }, 300);
}

function writeReview(){
  var myCommentElement = $('.my_comment');
  if (myCommentElement.length) {
    var elementTop = myCommentElement.offset().top;
    var elementHeight = myCommentElement.height();
    var screenHeight = $(window).height();
    var screenCenter = screenHeight / 2;

    $('html, body').animate({
      scrollTop: elementTop - screenCenter + elementHeight / 2
    }, 'slow');
  }
}
function commentSub(parent_id){
  var answer = $(`.answer_wrap[data-parent-id="${parent_id}"]`);
  if (answer.is(':hidden') || answer.css('display') === 'none') {
    answer.show();
  } else {
    answer.hide();
  }
};

const drawStar = (target) => {
  const starContainer = target.parentElement;
  const starSpan = starContainer.querySelector('.star span');
  const starValue = target.value || 3;
  const starPercentage = (starValue / 10) * 100;

  starSpan.style.width = `${starPercentage}%`;
};