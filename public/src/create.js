$(document).ready(function() {

    $('#thum').on("change", imgFile_thum);
    $(document).on("change", '.pictures', function (e) {
        imgFile_step(e, $(this));
    });
    
    getType();
    getIngre();
    manageIngres();
    manageSteps();
    
    $(document).on("click", '.done', function(){
        if(checkRecipe() === false){
            console.log('실패애오')
        }else if(checkRecipe() === true){
            insertRecipe()
            console.log('성공이애오오')
        }
    });
})

function getType(){
    $.get('/getType', function (data) {
        // 가져온 데이터를 사용하여 select 옵션을 동적으로 생성
        data.forEach(function (item) {
            $('#type').append($('<option>', {
                value: item.code,
                text: item.name
            }));
        })
    });
}
function getIngre(){
    $.get('/getIngre', function (data) {
        data.forEach(function (item) {
            $('#ingre').append($('<option>', {
                value: item.code,
                text: item.name
            }));
        })
    });
}

function imgFile_thum(e){
	$('#thum_img').remove();
	$('#callThum').remove();
    $('.thum_wrap .addPic').css('display','none');
	var files = e.target.files;
	var filesArr = Array.prototype.slice.call(files);
	
    if (filesArr.length === 0) {
        $('.addPic').css('display', 'block');
      }

	filesArr.forEach(function(f){
		
		/*확장자검사*/
		if(!f.type.match('image.*')){
			alert('이미지파일만 업로드 가능합니다.');
            $('.thum_wrap .addPic').css('display', 'block');
			return;
		}
		sel_file = f;
		var reader = new FileReader();
		reader.onload = function(e){
			var img = $('<img id="thum_img" alt="사용자 이미지" >');
			$('#thum_area').append(img);
			$('#thum_img').attr("src", e.target.result);
		}
		reader.readAsDataURL(f);
	});
}
function imgFile_step(e, input) {
    var listItem = input.closest('li');
    listItem.find('.step_img').remove();

    var files = e.target.files;
    var filesArr = Array.prototype.slice.call(files);
    input.siblings('.addPic').css('display', 'none');
    
    if (filesArr.length === 0) {
        input.siblings('.addPic').css('display', 'block');
    }

    filesArr.forEach(function (f) {
        /*확장자검사*/
        if (!f.type.match('image.*')) {
            alert('이미지파일만 업로드 가능합니다.');
            input.siblings('.addPic').css('display', 'block');
            return;
        }

        var reader = new FileReader();
        reader.onload = function (e) {
            var img = $('<img alt="사용자 이미지" class="step_img" >'); // 클래스 추가
            input.parent().append(img);
            img.attr("src", e.target.result);
        };
        reader.readAsDataURL(f);
    });
}


function manageIngres(){
    // 재료 추가 버튼 클릭 이벤트
    $('#ingre_up').click(function () {
        var newIngredientForm = $('<div class="ingre">\
            <input type="text" placeholder="재료명" maxlength="15">\
            <input type="text" placeholder="양/용량" maxlength="15">\
            <span class="ingre_down">-</span>\
        </div>');

        // 추가된 재료 입력 폼을 현재 마지막 div 뒤에 추가
        $('#ingre_up').before(newIngredientForm);
    });

    // 재료 삭제 버튼 클릭 이벤트
    $(document).on('click', '.ingre_down', function () {
        var ingreItems = $('.ingre');

        // 최소 한 개의 항목이 유지되도록
        if (ingreItems.length > 1) {
            // 현재 클릭된 .ingre_down 버튼의 부모 div를 삭제
            $(this).closest('.ingre').remove();
        }
    });
}
function manageSteps() {
    // 레시피 순서 추가 버튼 클릭 이벤트
    $('#step_up').click(function () {
        var stepIndex = $('.list').length + 1;

        var newListItem = $('<li class="list"></li>');

        var stepTitle = $('<h1>').text('STEP ' + stepIndex + '.');
        newListItem.append(stepTitle);

        var textarea = $('<textarea cols="30" rows="10" maxlength="120" placeholder="레시피 순서를 입력하세요."></textarea>');
        newListItem.append(textarea);

        // 고유한 ID 생성
        var inputId = 'list' + stepIndex;

        var fileLabel = $('<label for="' + inputId + '">'); // 동적으로 생성된 ID 할당
        var fileInput = $('<input type="file" name="pictures" class="pictures" multiple id="' + inputId + '">'); // 동적으로 생성된 ID 할당
        var fileImage = $('<img src="/img/plus.png" alt="사진첨부하기" class="addPic">');
        fileLabel.append(fileInput).append(fileImage);
        newListItem.append(fileLabel);

        // 추가 버튼 추가
        var step_downButton = $('<button class="step_down"><img src="/img/plus(white).png" alt=""></button>');
        newListItem.append(step_downButton);

        // 생성된 리스트 아이템을 ul에 추가
        $('#step_up').before(newListItem);

        // 순서 항목이 2개 이상이면 .step_down 보이기
        if ($('.list').length > 2) {
            $('.step_down').css('display', 'block');
        }
    });
    
    // 레시피 순서 삭제 버튼 클릭 이벤트
    $(document).on('click', '.step_down', function () {
        var listItems = $('.list');
    
        // 최소 두 개의 항목이 유지되도록
        if (listItems.length > 2) {
            // 현재 클릭된 .step_down 버튼의 부모 li를 삭제
            $(this).closest('li').remove();
    
            // 남은 순서의 제목을 업데이트
            $('.list h1').each(function (index) {
                $(this).text('STEP ' + (index + 1) + '.');
            });
    
            // 순서 항목이 2개 이하면 .step_down 감추기
            if ($('.list').length <= 2) {
                $('.step_down').css('display', 'none');
            }
        }
    });
}
function insertRecipe(){
    // 사용자가 입력한 데이터 수집
    const formData = new FormData();
    const thumFile = $('#thum')[0].files[0];
    formData.append('thum', thumFile);
    formData.append('beauty', $('input[name="beauty"]').val());
    formData.append('title', $('input[name="title"]').val());
    formData.append('ingredient', $('select[name="ingredient"]').val());
    formData.append('recipe_type', $('select[name="recipe_type"]').val());
    formData.append('time', $('select[name="time"]').val());
    formData.append('level', $('select[name="level"]').val());
    formData.append('ingre_tip', $('textarea[name="ingre_tip"]').val());
    formData.append('introduction', $('textarea[name="introduction"]').val());
    formData.append('tip', $('textarea[name="tip"]').val());

    $.ajax({
        type: 'POST',
        url: '/insert_recipe',
        data: formData,
        contentType: false,
        processData: false,
        success: function (response) {
            console.log(response + "성공");
            const recipeId = response.recipeId;
            sendIngredients(recipeId);
            sendSteps(recipeId);
        },
        error: function (error) {
            console.error('insert_recipe Ajax 오류:', error);
        },
    });
}
function sendIngredients(recipeId) {
    const ingreItems = $('.ingre');
    const ingredientsData = [];

    ingreItems.each(function (index) {
        const ingreName = $(this).find('input[type="text"]').eq(0).val();
        const ingreAmount = $(this).find('input[type="text"]').eq(1).val();

        //값을 key:value로 push하여 배열에 저장
        ingredientsData.push({
            name: ingreName,
            amount: ingreAmount
        })
    });

    $.ajax({
        type: 'POST',
        url: '/insert_recipe_ingredients',
        data: JSON.stringify({recipeId: recipeId, ingredient: ingredientsData }),  // 변경된 부분
        contentType: 'application/json',
        success: function (response) {
            console.log(response + " ingredients 성공");
        },
        error: function (error) {
            console.error('ingredients Ajax 오류:', error);
        },
    });
}
function sendSteps(recipeId) {
    const formData = new FormData();

    $('.list').each(function (index) {
        const stepContent = $(this).find('textarea').val();
        const stepFile = $(this).find('.pictures')[0].files[0];
        // const stepPicture = stepFile ? stepFile.name : ''; // 파일이 없을 경우 빈 문자열
        formData.append('contents[]', stepContent);
        formData.append('pictures[]', stepFile);   
    });

    // 레시피 ID를 formData에 추가
    formData.append('recipeId', recipeId);

    $.ajax({
        type: 'POST',
        url: '/insert_recipe_steps',
        data: formData,
        contentType: false,
        processData: false,
        success: function (response) {
            console.log(response + " 성공");
            alert("레시피 등록이 완료되었습니다 :)");
            window.location.href = '/recipe_type';
        },
        error: function (error) {
            console.error('insert_recipe_steps Ajax 오류:', error);
        },
    });
}
function checkRecipe(){
    let hasIngredients = false; // 재료 입력 여부 체크
    let hasStep = false; //step 입력 여부 체크

    const thumFile = $('#thum')[0].files[0];
    const beuaty = $('input[name="beauty"]');
    const title =  $('input[name="title"]')
    const introduction = $('textarea[name="introduction"]');

    if(!thumFile){
        alert('대표 사진을 등록해주세요')
        // $('html, body').scrollTop($('#thum').offset().top);
        return false;
    }
    if(!beuaty.val()){
        alert('레시피 별칭을 입력해주세요')
        beuaty.focus()
        return false;
    }
    if(!title.val()){
        alert('레시피 이름을 입력해주세요')
        title.focus()
        return false;
    }
    if(!introduction.val()){
        alert('레시피 소개를 입력해주세요')
        introduction.focus()
        return false;
    }
    const ingreItems = $('.ingre');

    ingreItems.each(function (index) {
        const ingreName = $(this).find('input[type="text"]').eq(0);
        const ingreAmount = $(this).find('input[type="text"]').eq(1);

        // 재료명과 양이 모두 입력되지 않은 경우
        if (ingreName.val().trim() === '' && ingreAmount.val().trim() === '') {
            alert('재료 등록에 입력되지 않은 칸이 있습니다.');
            ingreName.focus();
            hasIngredients = false;
            return false; // 레시피 완성 중단
        }

        if (!ingreName.val() || ingreName.val().trim() === '') {
            alert('재료명을 입력해주세요.');
            ingreName.focus();
            hasIngredients = false;
            return false; // 현재 루프 종료
        }

        // 양만 입력되지 않은 경우
        if (!ingreAmount.val() || ingreAmount.val().trim() === '') {
            alert('양/용량을 입력해주세요.');
            ingreAmount.focus();
            hasIngredients = false;
            return false; // 현재 루프 종료
        }
        hasIngredients = true;
    });

    //한 개도 없을 경우 return
    if (!hasIngredients) {
        return false;
    }

    $('.list').each(function (index) {
        const stepContent = $(this).find('textarea').val();
        const stepFile = $(this).find('.pictures')[0].files[0];
        // const stepPicture = stepFile ? stepFile.name : ''; // 파일이 없을 경우 빈 문자열

        if (!stepContent.trim() && !stepFile) {
            alert('비어있는 Step이 있습니다.');
            $(this).find('textarea').focus();
            hasStep = false;
            return false; // 루프 중단
        }

        // 2. file은 있는데 content가 없으면 알림창 표시
        if (!stepContent.trim() && stepFile) {
            alert('Step을 작성해 주세요.');
            $(this).find('textarea').focus();
            hasStep = false;
            return false; // 루프 중단
        }

        // 3. content가 있는데 file이 없으면 알림창 표시
        if (stepContent.trim() && !stepFile) {
            alert('Step에 요리 사진을 넣어주세요.');
            $(this).find('textarea').focus();
            hasStep = false;
            return false; // 루프 중단
        }
        hasStep = true;
    });
    //한 개도 없을 경우 return
    if (!hasStep) {
        return false;
    }
    
    return true;
}