/* header active class */
$(window).scroll(function () {
    if ($(window).scrollTop() > 50) {
        $('header, .top_btn, .recipe_btn').addClass('active');
        $('.gnb .search').attr('src', '/img/search(black).png');
        $('header .logo').addClass('active');
        $('nav ul .dept1 a').addClass('active');
        $('.gnb p').addClass('active');
        $('.gnb .my_inform').attr('src', '/img/mypage(detail).png');
    } else {
        $('header, .top_btn, .recipe_btn').removeClass('active');
        $('header .logo').removeClass('active');
        $('nav ul .dept1 a').removeClass('active');
        $('.gnb .search').attr('src', '/img/search.png');
        $('.gnb p').addClass('active');
        $('.gnb .my_inform').attr('src', '/img/mypage(detail).png');
    }
});
$(function () {
    $('.login').on('click', function(){
        const returnUrl = encodeURIComponent(window.location.href);
        // 로그인 페이지로 이동
        window.location.href = '/login?returnTo=' + returnUrl;
    })
})
$(function () {
    $('.recipe_btn').on('click', function(){
        // 로그인 페이지로 이동
        window.location.href = '/recipe_create'
    })
})
$(function () {
    $('.dept_hover, .dept2').hover(
        function () {
            $('header').addClass('hovered');
        },
        function () {
            $('header').removeClass('hovered');
        }
    );
});

$(function () {
    $('#header').hover(
        function () {
            $('.gnb .search').attr('src', '/img/search(green).png');
            $('.gnb p').addClass('active');
            $('.gnb .my_inform').attr('src', '/img/mypage(detail).png');
        },
        function () {
            $('.gnb .search').attr('src', '/img/search.png');
            $('.gnb p').removeClass('active');
            $('.gnb .my_inform').attr('src', '/img/mypage(detail).png');
        }
    );
});


// 롤링 배너 복제본 생성

    let roller = document.querySelector('.best_recipe_wrap');
    if(roller!='' && roller!=null){
        roller.id = 'roller1';
        let clone = roller.cloneNode(true)
        clone.id = 'roller2';
        document.querySelector('.best_wrap').appendChild(clone);
    
        document.querySelector('#roller1').style.left = '0px';
        document.querySelector('#roller2').style.left = document.querySelector('.best_recipe_wrap ul').offsetWidth + 'px';
        
        roller.classList.add('original');
        clone.classList.add('clone');
    }
        
    
/* 카테고리 스와이퍼 */
var swiper = new Swiper(".mySwiper", {
    /* spaceBetween: 30, */ // 슬라이드 사이 여백
    slidesPerView: '3', // 한 슬라이드에 보여줄 갯수
    slidesPerGroup : '3',
    spaceBetween :'20',
    pagination: {
        el: ".swiper-pagination",
        type: "progressbar",
    },
    navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
    },
});

/* BTN_TOP */
$(function () {
    $(".top_btn").click(function () {
        $('html,body').animate({
            scrollTop: 0
        }, 400);
        return false;
    })
});
