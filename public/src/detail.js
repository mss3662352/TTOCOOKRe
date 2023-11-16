$(document).ready(function(){
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const recipeId = urlParams.get('id');

// 이제 'recipeId'에는 URL에서 추출한 값이 들어 있습니다.
console.log('Recipe ID:', recipeId);
  getDetail(recipeId)
})
function getDetail(recipeId){
    $.ajax({
      url: '/getDetail',
      method: 'GET',
      data: { id: recipeId },
      dataType: 'json',
      success: function (data) {
          console.log('Recipe details:', data);

          renderRecipeDetails(data);
      },
      error: function (error) {
          console.error('Error fetching recipe details:', error);
          // Handle the error, e.g., show an error message
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
    ingredients: data.ingredients, // 재료 정보
    steps: data.steps, // 단계 정보
    // 여기에 필요한 다른 정보들도 추가할 수 있습니다.
  };

  // 각 엘리먼트에 데이터를 채워넣기
  var thumbnailPath = recipeDetails.thumbnail ? recipeDetails.thumbnail.replace('\public', '') : '';
  console.log('thumbnailPath :' +thumbnailPath)
  var level = convertLevelToText(recipeDetails.level)
  $('[name="beauty"]').text(recipeDetails.beauty);
  $('[name="title"]').text(recipeDetails.title);
  $('[name="level"]').text(level);
  $('[name="time"]').text(recipeDetails.time + '분');
  $('[name="nickname"]').text(recipeDetails.nickname);
  $('[name="thumbnail"]').attr('src', thumbnailPath);
  $('[name="introduction"]').text(recipeDetails.introduction);
  $('[name="ingre_tip"]').text(recipeDetails.ingre_tip);

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
    console.log('stepPicture : '+stepPicture)
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
/* window.addEventListener('scroll', function () {

  const ingreElement = document.querySelector('.ingre');

  const isScrolledIntoView = isInView(ingreElement);

  const ingreListWrap = document.querySelector('.ingre');
  ingreListWrap.style.opacity = isScrolledIntoView ? 1 : 0;
});

function isInView(element) {
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;

  const verticalCenter = windowHeight / 2;
  const horizontalCenter = windowWidth / 2;

  return rect.top <= verticalCenter && rect.bottom >= verticalCenter &&
    rect.left <= horizontalCenter && rect.right >= horizontalCenter;
} */



/* PICK */
function togglePick() {
  const pickButton = document.querySelector('.pick>img');
  const pickImage = document.getElementById('pickImage');
  const currentSrc = pickImage.src;

  if (currentSrc.includes('pick.png')) {

    pickImage.src = currentSrc.replace('pick.png', 'pick_red.png');
  } else if (currentSrc.includes('pick_red.png')) {

    pickImage.src = currentSrc.replace('pick_red.png', 'pick.png');
  }

  pickButton.classList.toggle('clicked');

  setTimeout(() => {
    pickButton.classList.toggle('clicked');
  }, 200);
}

