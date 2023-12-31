var currentPage = 1; // 현재 페이지
var recipeTypeCode = ''; // 레시피 타입 코드

$(document).ready(function () {
    getRecipeType();
});

function getRecipeType() {
    $.get('/getType', function (data) {
        // 가져온 데이터를 사용하여 select 옵션을 동적으로 생성
        data.forEach(function (item) {
            var li = $('<li>');
            var a = $('<a>', {
                href: '#',
                id: item.code,
                text: item.name
            });

            li.append(a);
            $('.recipe_type_tab').append(li);
        });

        // 활성 탭 설정
        var hash = window.location.hash;
        if (hash) {
            code = hash.replace('#', '');
            getRecipes(code);
            
            // 모든 탭에서 active 클래스 제거
            $('.recipe_type_tab li').removeClass('active');
            $('.recipe_type_tab li').find('a[id="' + code + '"]').closest('li').addClass('active');
        } else {
            getRecipes();
        }

        // 레시피 타입 탭 클릭 이벤트
        $('.recipe_type_tab').on('click', 'li a', function (event) {
            event.preventDefault();
            currentPage = 1;
            recipeTypeCode = $(this).attr('id');

            getRecipes(recipeTypeCode);

            $('.recipe_type_tab li').removeClass('active');
            $(this).parent('li').addClass('active');
        });
    });
}

function getRecipes(recipeTypeCode) {
    var url = recipeTypeCode ? `/getRecipes?&page=${currentPage}&recipeTypeCode=${recipeTypeCode}` : `/getRecipes?page=${currentPage}`;

    $.ajax({
        url: url,
        method: 'GET',
        dataType: 'json',
        success: function (data) {
            renderRecipes(data);
            renderPagination(data.totalPages, currentPage);
        },
        error: function (error) {
            console.error('Error fetching recipes:', error);
        }
    });
}

function renderRecipes(data) {
    var recipes = data.recipes || []; // 레시피 목록 또는 빈 배열
    var contentList = $('.content_list');
    contentList.empty(); // 기존 내용 비우기

    recipes.forEach(function (recipe) {
        var thumbnailPath = recipe.thumbnail ? recipe.thumbnail.replace('\public', '') : '';
        var level = convertLevelToText(recipe.level);
        var recipeItem = `
            <li>
                <a href="#" class="recipe-item" data-recipe-id="${recipe.id}">
                    <input type="hidden" value="${recipe.id}">
                    <div class="recipe_thum">
                        <img src="${thumbnailPath}" alt="">
                        <div class="thum_over"></div>
                    </div>
                    <div class="menu_title">
                        <span>${recipe.beauty}</span>
                        <h3>${recipe.title}</h3>
                        <div class="menu_inform">
                            <div class="graph">
                                <div class="icon">
                                    <img src="/img/graph.png" alt="">
                                </div>
                                <span>${level}</span>
                            </div>
                            <div class="time">
                                <div class="icon">
                                    <img src="/img/clock.png" alt="">
                                </div>
                                <span>${recipe.time}분</span>
                            </div>
                        </div>
                    </div>
                </a>
            </li>
        `;

        contentList.append(recipeItem);
    });
    $('.recipe-item').on('click', function (event) {
        event.preventDefault();
        var recipeId = $(this).data('recipe-id');
        detailRecipe(recipeId);
    });
}
function detailRecipe(recipe_id){
    window.location.href = '/detailRecipe?id=' + recipe_id;
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
function renderPagination(totalPages, currentPage) {
    var pagination = $('.pagination ul');
    pagination.empty();

    // 이전 화살표 추가
    pagination.append(`
        <li id="prevPage"><img src="/img/prev_arrow.png" alt=""></li>
    `);

    // 페이지 수만큼 반복하여 페이지 번호 또는 현재 페이지인 경우 활성화된 스타일로 추가
    for (var i = 1; i <= totalPages; i++) {
        var pageItem = `<li class="${currentPage === i ? 'active' : ''}"><span>${i}</span></li>`;
        pagination.append(pageItem);
    }

    // 다음 화살표 추가
    pagination.append(`
        <li id="nextPage"><img src="/img/next_arrow.png" alt=""></li>
    `);

    // 이전 화살표 클릭 이벤트
    $('#prevPage').on('click', function () {
        if (currentPage > 1) {
            changePage(currentPage - 1);
        }
    });

    // 다음 화살표 클릭 이벤트
    $('#nextPage').on('click', function () {
        if (currentPage < totalPages) {
            changePage(currentPage + 1);
        }
    });

    // 각 페이지 번호 클릭 이벤트
    pagination.find('span').on('click', function () {
        var page = parseInt($(this).text());
        changePage(page);
    });
}

function changePage(page) {
    currentPage = page;
    getRecipes(recipeTypeCode);
}
