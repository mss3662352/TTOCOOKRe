const express = require('express');
const session = require('express-session');
const crypto = require('crypto');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const bodyParser = require('body-parser');
const fs = require('fs');
const db = require("./config/database.js");

const app = express();
const port = 3000;
const generateRandomString = (length) => {
    return crypto.randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length);
};

// EJS를 뷰 엔진으로 설정
app.set('view engine', 'ejs');
app.set('views', [path.join(__dirname, 'views'), __dirname]);

// secret 생성
const secret = generateRandomString(32); // 32글자의 랜덤 문자열 생성
console.log('Generated secret:', secret);

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: secret, // 세션을 암호화하는 데 사용되는 키
    resave: false,
    saveUninitialized: true
}));
app.use((req, res, next) => {
    // isAuthenticated 변수를 모든 뷰에서 사용할 수 있도록 res.locals에 추가
    res.locals.isAuthenticated = req.session.user ? true : false;
    next(); // 다음 미들웨어로 이동
});


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'public/uploads';
        // uploads 디렉토리가 없으면 생성
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

app.get('/', (req, res) => {
    const isAuthenticated = req.session.user ? true : false;
    res.render('index', { isAuthenticated });
});
app.get('/login', (req, res) => {
    const isAuthenticated = req.session.user ? true : false;
    res.render('login', { isAuthenticated: isAuthenticated });
});
app.post('/userLogin', (req, res) => {
    const users = req.body;
  
    const query = 'SELECT * FROM users WHERE userid = ? AND userpw = ?';
    db.query(query, [users.id, users.pw], (err, results) => {
      if (err) {
        console.error('Error querying the database:', err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
      } else {
        if (results.length > 0) {
            // 로그인 성공 시 세션에 사용자 정보 저장
            req.session.user = results[0];
            res.json({ success: true, message: 'Login 성공' });
        } else {
            res.status(401).json({ success: false, message: '아이디 또는 비밀번호가 일치하지 않습니다.' });
        }
      }
    });
});
app.get('/logout', (req, res) => {
    // 세션을 파괴하여 사용자를 로그아웃합니다
    req.session.destroy((err) => {
        if (err) {
            console.error('세션 파괴 중 오류 발생:', err);
            res.status(500).json({ success: false, message: '내부 서버 오류' });
        } else {
            res.redirect('/login');
        }
    });
});
app.get('/join', (req, res) => {
    const isAuthenticated = req.session.user ? true : false;
    res.render('join', { isAuthenticated: isAuthenticated });
});
app.post('/register',(req, res)=>{
    const userData = req.body;

    const query = `INSERT INTO users(userid, userpw, name, nickname, email) 
    VALUES(?, ?, ?, ?, ?)`
    db.query(query, [userData.id, userData.password, userData.name, userData.nickname, userData.email], (err, results) => {
        if (err) {
            console.error('쿼리 오류: ' + err.stack);
            res.status(500).json({ error: '회원가입 중 오류가 발생했습니다.' });
            return;
          }
      
          res.status(200).json({ message: '회원가입이 완료되었습니다.' });
    })
})

app.post('/checkId', (req, res) => {
    const requestedId = req.body.userId;
  
    // MySQL에서 아이디 중복 확인
    const sql = 'SELECT userid FROM users WHERE userid = ?';
    db.query(sql, [requestedId], (err, result) => {
      if (err) {
        console.error('MySQL query error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }
  
      // 결과를 클라이언트에게 응답
      const isDuplicate = result.length > 0;
      res.json({ isDuplicate });
    });
});
app.post('/checkNick', (req, res) => {
    const requestedNick = req.body.nickname;
  
    // MySQL에서 아이디 중복 확인
    const sql = 'SELECT userid FROM users WHERE nickname = ?';
    db.query(sql, [requestedNick], (err, result) => {
      if (err) {
        console.error('MySQL query error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }
  
      // 결과를 클라이언트에게 응답
      const isDuplicate = result.length > 0;
      res.json({ isDuplicate });
    });
});

app.get('/getRecipes', (req, res) => {
    const page = req.query.page || 1; // 페이지 번호, 기본값은 1
    const pageSize = 16; // 페이지당 항목 수
    const offset = (page - 1) * pageSize;
    const pageType = req.query.pageType || 1;
    const recipeTypeCode = req.query.recipeTypeCode; // 레시피 타입 코드

    // 레시피 타입에 따른 또는 전체 레시피 목록을 가져오는 엔드포인트
    const query = `
        SELECT id, user_id, beauty, title, thumbnail, ingredient, time, level, ingre_tip, introduction, tip, good, view 
        FROM RECIPE
        ${recipeTypeCode && pageType == 1 ? 'WHERE recipe_type = ?' : ''}
        ${recipeTypeCode && pageType == 2 ? 'WHERE ingredient = ?' : ''} 
        order by id desc 
        LIMIT ${offset}, ${pageSize}
    `;

    // 레시피 타입에 따른 또는 전체 전체 레시피 수를 가져오는 쿼리
    const countQuery = (recipeTypeCode && pageType === 1) ?
    'SELECT COUNT(*) as total FROM RECIPE WHERE recipe_type = ?' :
    ((recipeTypeCode && pageType === 2) ?
        'SELECT COUNT(*) as total FROM RECIPE WHERE ingredient = ?' :
        'SELECT COUNT(*) as total FROM RECIPE');

    // 병렬로 두 쿼리 실행
    db.query(query, recipeTypeCode ? [recipeTypeCode] : [], (error, results) => {
        if (error) {
            console.error('Error fetching recipes:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        db.query(countQuery, recipeTypeCode ? [recipeTypeCode] : [], (countError, countResults) => {
            if (countError) {
                console.error('Error fetching recipe count:', countError);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }

            const totalRecipes = countResults[0].total;
            const totalPages = Math.ceil(totalRecipes / pageSize);
            // 결과를 클라이언트에 전송
            res.json({
                recipes: results,
                totalPages: totalPages
            });
        });
    });
});

app.get('/recipe_type', (req, res) => {
    const isAuthenticated = req.session.user ? true : false;
    res.render('recipe_type', { isAuthenticated: isAuthenticated });
});

app.get('/recipe_ingre', (req, res) => {
    const isAuthenticated = req.session.user ? true : false;
    res.render('recipe_ingre', { isAuthenticated: isAuthenticated });
});

app.get('/recipe_create', (req, res) => {
    const isAuthenticated = req.session.user ? true : false;
    res.render('create', { isAuthenticated: isAuthenticated });
});
app.get('/getType', (req, res) => {
    const query = "SELECT code, name FROM common_code WHERE super_code = 'RTYPE' ORDER BY ord ASC";

    db.query(query, (err, results) => {
        if (err) {
            console.error('쿼리 실행 오류:', err);
            res.status(500).send('getType internal Server Error');
        } else {
            res.json(results);
        }
    });
});
app.get('/getIngre', (req, res) => {
    const query = "SELECT code, name FROM common_code WHERE super_code = 'INGRE' ORDER BY ord ASC";

    db.query(query, (err, results) => {
        if (err) {
            console.error('쿼리 실행 오류:', err);
            res.status(500).send('Internal Server Error');
        } else {
            res.json(results);
        }
    });
});


// 이미지와 데이터를 함께 전송받아 레시피 등록 처리
app.post('/insert_recipe', upload.single('thum'), (req, res) => {
    const thumbnailPath = req.file.path;

    // 나머지 레시피 데이터
    const title = req.body.title;
    const beauty = req.body.beauty;
    const ingredient = req.body.ingredient;
    const recipe_type = req.body.recipe_type;
    const time = req.body.time;
    const level = req.body.level;
    const ingre_tip = req.body.ingre_tip;
    const introduction = req.body.introduction;
    const tip = req.body.tip;

    //재료 부분
    const ingredients = req.body.ingredients;
    //stpe 부분
    let steps;
    try {
        steps = JSON.parse(req.body.steps);
    } catch (e) {
        console.error('Error parsing steps:', e);
        res.status(400).send('Invalid steps data');
        return;
    };
    // MySQL에 데이터 삽입 쿼리 수행
    const sql = `INSERT INTO recipe (user_id, beauty, title, thumbnail, ingredient, recipe_type, time, level, ingre_tip, introduction, tip) 
        VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(sql, [beauty, title, thumbnailPath, ingredient, recipe_type, time, level, ingre_tip, introduction, tip], (error, results, fields) => {
        if (error) {
            console.error('MySQL 오류:', error);
            res.status(500).send('서버 오류');
            return;
        }
         // 삽입된 레시피의 ID 가져오기
        const recipeId = results.insertId;


        // recipe_ingredients 테이블에 재료 데이터 삽입
        const ingreInsertQuery = `INSERT INTO recipe_ingredients (recipe_id, name, amount) VALUES ?`;
        const ingreValues = ingredients.map(ingre => [recipeId, ingre.name, ingre.amount]);

        db.query(ingreInsertQuery, [ingreValues], (ingreError, ingreResults) => {
            if (ingreError) {
                console.error('MySQL 재료 삽입 오류:', ingreError);
                res.status(500).send('서버 오류');
                return;
            }
        });

        const insertStepQuery = `INSERT INTO step (recipe_id, content, picture, ord) VALUES ?`;
        const stepValues = steps.map((step, index) => [recipeId, step.content, step.picture, index + 1]);
        db.query(insertStepQuery, [stepValues], (stepError, stepResults) => {
            if (stepError) {
                console.error('MySQL 스텝 삽입 오류:', stepError);
                res.status(500).send('서버 오류');
                return;
            }

            res.status(200).send('레시피가 성공적으로 등록되었습니다.');
        });
    });

});

app.get('/guide', (req, res) => {
    const isAuthenticated = req.session.user ? true : false;
    res.render('guide', { isAuthenticated: isAuthenticated });
});
app.get('/search', (req, res) => {
    const isAuthenticated = req.session.user ? true : false;
    res.render('search', { isAuthenticated: isAuthenticated });
});

//에러 핸들링
app.use((req, res, next) => {
    res.status(404).send('404 Not Found');
});
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('500 Internal Server Error');
  });


//port cnosole.log
app.listen(port, () => {
    console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});