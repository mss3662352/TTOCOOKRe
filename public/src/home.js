
$(homeRecentRecipe());
$(homeBestRecipe());
function getBestSwiper(data){
    const swiperWrapper = $('.best_wrap ul');
    swiperWrapper.empty();
    data.bestRecipes.forEach(function (recipe) {
        const recentRecipes =
            `<li>
                <a href="/detailRecipe?id=${recipe.id}">  
                    <img src="${recipe.thumbnail.replace('\public', '')}" alt="">  
                    <div class="over_title">
                        <div class="over_title_inner">
                            <span>${recipe.beauty}<br />${recipe.title}</span>
                        </div>
                    </div>
                </a>
            </li>`;
        swiperWrapper.append(recentRecipes);
    });
}
function getRecentSwiper(data) {  // 함수 이름 수정
    const swiperWrapper = $('.choice_contents ul');
    swiperWrapper.empty();
    data.recipes.forEach(function (recipe) {
        const bestRecipes =
            `<li class="swiper-slide">
                <a href="/detailRecipe?id=${recipe.id}">  
                    <img src="${recipe.thumbnail.replace('\public', '')}" alt="">  
                    <div class="choice_over">
                        <div>
                            <span>${recipe.beauty}</span>
                            <p>${recipe.title}</p>
                        </div>
                    </div>
                </a>
            </li>`;
        swiperWrapper.append(bestRecipes);
    });
}

function homeRecentRecipe(){
    $.ajax({
      url: '/homeRecentRecipe',
      method: 'GET',
      dataType: 'JSON',
      success: function (data) {
        getRecentSwiper(data);
      },
      error: function (error) {
          console.error('Error fetching recipe details:', error);
      }
  });
}
function homeBestRecipe(){
    $.ajax({
      url: '/homeBestRecipe',
      method: 'GET',
      dataType: 'JSON',
      success: function (data) {
        getBestSwiper(data);
      },
      error: function (error) {
          console.error('Error fetching recipe details:', error);
      }
  });
}