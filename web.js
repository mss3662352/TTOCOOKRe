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
const port = 8001;
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
    secret: secret,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));
app.use((req, res, next) => {
    // isAuthenticated 변수를 모든 뷰에서 사용할 수 있도록 res.locals에 추가
    res.locals.isAuthenticated = req.session.user ? true : false;

    // 세션에서 사용자 ID를 가져오기
    res.locals.sessionUserId = req.session.user ? req.session.user.id : null;

    next(); // 다음 미들웨어로 이동
});
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'public/uploads/thumbnail';
        // 디렉토리가 없으면 생성
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

const storageForPicture = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'public/uploads/pictures';
        // 디렉토리가 없으면 생성
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const uploadForPicture = multer({ storage: storageForPicture });

const storageForReply = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'public/uploads/reply';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const uploadForReply = multer({ storage: storageForReply });

app.get('/', (req, res) => {
    const isAuthenticated = req.session.user ? true : false;

    res.render('index', { isAuthenticated: isAuthenticated});
});
app.get('/getUserId', (req, res) => {
    const userId = req.session.user ? req.session.user.id : null;
  
    if (userId) {
      res.json({ success: true, userId });
    } else {
      res.json({ success: false, message: '사용자 ID를 찾을 수 없습니다.' });
    }
});
app.get('/homeRecentRecipe', (req, res) =>{


    const query = 'SELECT id, beauty, title, thumbnail, created_at FROM recipe ORDER BY created_at DESC LIMIT 9';

    db.query(query, (error, results) => {
        if (error) {
            console.error('Error querying the database:', error);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }

        res.json({ recipes: results });
    })
})
app.get('/homeBestRecipe', (req, res) =>{


    const query = 'SELECT id, beauty, title, thumbnail, good FROM recipe ORDER BY good DESC LIMIT 7';

    db.query(query, (error, bestRecipes) => {
        if (error) {
            console.error('Error querying the database:', error);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }

        res.json({ bestRecipes: bestRecipes });
    })
})
app.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/');
    }
     // 현재 페이지의 URL을 세션에 저장
     req.session.returnTo = req.query.returnTo || '/';

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

            // 리디렉션할 URL이 세션에 저장되어 있으면 해당 페이지로 이동, 없으면 홈페이지로 이동
            const redirectUrl = req.session.returnTo || '/';
            res.json({ success: true, message: 'Login 성공', redirectUrl: redirectUrl });

            // 세션에 저장된 리디렉션 URL 초기화
            req.session.returnTo = null;
        } else {
            res.status(200).json({ success: false, message: '아이디 또는 비밀번호가 일치하지 않습니다.' });
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
            
            res.redirect('/');
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
        SELECT id, user_id, beauty, title, thumbnail, ingredient, time, level, ingre_tip, introduction, tip, good 
        FROM recipe
        ${recipeTypeCode && pageType == 1 ? 'WHERE recipe_type = ?' : ''}
        ${recipeTypeCode && pageType == 2 ? 'WHERE ingredient = ?' : ''} 
        order by id desc 
        LIMIT ${offset}, ${pageSize}
    `;

    // 레시피 타입에 따른 또는 전체 전체 레시피 수를 가져오는 쿼리
    const countQuery = (recipeTypeCode && pageType === 1) ?
    'SELECT COUNT(*) as total FROM recipe WHERE recipe_type = ?' :
    ((recipeTypeCode && pageType === 2) ?
        'SELECT COUNT(*) as total FROM recipe WHERE ingredient = ?' :
        'SELECT COUNT(*) as total FROM recipe');

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
    if (isAuthenticated) {
        res.render('create', { isAuthenticated: isAuthenticated });
    } else {
        res.redirect('/login?returnTo=/recipe_create');
    };
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
    const user = req.session.user;
    const userId = user.id;

    const thumbnailPath = req.file.path;
    console.log('req.file.path : '+ req.file.path)
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
    
    const sql = `INSERT INTO recipe (user_id, beauty, title, thumbnail, ingredient, recipe_type, time, level, ingre_tip, introduction, tip) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(sql, [userId, beauty, title, thumbnailPath, ingredient, recipe_type, time, level, ingre_tip, introduction, tip], (error, results, fields) => {
        if (error) {
            console.error('MySQL 오류:', error);
            res.status(500).send('서버 오류');
            return;
        }
        const recipeId = results.insertId;

        res.status(200).json({ success: true, recipeId: recipeId });
    });
});

app.post('/insert_recipe_ingredients', (req, res) => {
    const recipeId =  req.body.recipeId;
    const ingredients = req.body.ingredient;

    // 재료 부분
    const ingreInsertQuery = `INSERT INTO recipe_ingredients (recipe_id, name, amount) VALUES ?`;
    const ingreValues = ingredients.map(ingre => [recipeId, ingre.name, ingre.amount]);

    db.query(ingreInsertQuery, [ingreValues], (ingreError, ingreResults) => {
        if (ingreError) {
            console.error('MySQL 재료 삽입 오류:', ingreError);
            res.status(500).send('서버 오류');
            return;
        }

        res.status(200).json({ success: true, recipeId: recipeId });
    });
});
app.post('/insert_recipe_steps', uploadForPicture.array('pictures[]'), (req, res) => {
    const recipeId = req.body.recipeId;
    const contents = req.body.contents;
    const stepInsertQuery = `INSERT INTO step (recipe_id, content, picture, ord) VALUES ?`;
    const stepValues = contents.map((content, index) => [recipeId, content, req.files[index].path, index + 1]);
    
    db.query(stepInsertQuery, [stepValues], (stepError, stepResults) => {
        if (stepError) {
            console.error('MySQL 스텝 삽입 오류:', stepError);
            res.status(500).send('서버 오류');
            return;
        }

        res.redirect('/recipe_create');
    });
});

app.get('/detailRecipe', (req, res) => {
    const isAuthenticated = req.session.user ? true : false;
    const recipeId = req.query.id;

    res.render('detail', { isAuthenticated, recipeId});
})
app.get('/getDetail', (req, res) => {
    const isAuthenticated = req.session.user ? true : false;
    const recipeId = req.query.id;

    // 레시피 정보 쿼리
    const recipeQuery = `
        SELECT r.id, r.user_id, u.nickname, beauty, title, thumbnail, ingredient, recipe_type, time, level, ingre_tip, introduction, tip, good, r.created_at
        FROM recipe r
        LEFT JOIN 
        users u ON r.user_id = u.id
        WHERE r.id = ?
    `;
    // 재료 정보 쿼리
    const ingredientQuery = `
        SELECT name, amount
        FROM recipe_ingredients
        WHERE recipe_id = ?
    `;
    // 단계 정보 쿼리
    const stepQuery = `
        SELECT content, picture, ord
        FROM step
        WHERE recipe_id = ?
        ORDER BY ord
    `;
     // 병렬로 쿼리 실행
     db.query(recipeQuery, [recipeId], (error, recipeResults) => {
        if (error) {
            console.error('Error fetching recipe:', error);
            res.status(500).send('Internal Server Error');
            return;
        }

        // 재료 정보 가져오기
        db.query(ingredientQuery, [recipeId], (ingredientError, ingredientResults) => {
            if (ingredientError) {
                console.error('Error fetching ingredients:', ingredientError);
                res.status(500).send('Internal Server Error');
                return;
            }

            // 단계 정보 가져오기
            db.query(stepQuery, [recipeId], (stepError, stepResults) => {
                if (stepError) {
                    console.error('Error fetching steps:', stepError);
                    res.status(500).send('Internal Server Error');
                    return;
                }

                const recipe = recipeResults[0];
                const ingredients = ingredientResults;
                const steps = stepResults;

                // 결과를 클라이언트에 전송
                res.json({isAuthenticated, recipe, ingredients, steps });
            });
        });
    });
});
app.get('/getRecipeReply', (req, res) => {
    const recipeId = req.query.id;
    const isAuthenticated = req.session.user ? true : false;
    const userSession = req.session.user ?  req.session.user :  null;
    const sessionUserId = req.session.user ? req.session.user.id : null;

    // 레시피 정보 쿼리
    const replyQuery = `
        SELECT rr.id, rr.recipe_id, rr.user_id, u.nickname,  rr.content, rr.picture, rr.rating, rr.created_at,
        rr.updated_at, rr.parent_reply_id
        FROM recipe_reply rr 
        JOIN users u ON u.id = rr.user_id 
        JOIN recipe r ON r.id = rr.recipe_id
        WHERE r.id = ?
        ORDER BY rr.id DESC
    `;
    db.query(replyQuery, [recipeId], (error, replies) => {
        if (error) {
            console.error('Error fetching recipe:', error);
            res.status(500).send('Internal Server Error');
            return;
        }

        const topLevelReplies = replies.filter(reply => reply.parent_reply_id === null);
        const childReplies = replies.filter(reply => reply.parent_reply_id !== null);
        res.json({ isAuthenticated, sessionUserId, userSession, topLevelReplies, childReplies });
    });
});
app.post('/insert_reply', uploadForReply.single('picture'), (req, res) => {
    const userId = req.session.user ? req.session.user.id : null;
    const recipeId = req.body.recipeId;
    const parentReplyId = req.body.parentReplyId !='null' ? req.body.parentReplyId : null;
    const rating = req.body.rating;
    const content = req.body.content;
    const picturePath = req.file ? req.file.path : null;
    if (!userId) {
        return res.status(200).json({ success: false, message: '로그인 후 이용해 주세요.' });
    }

    let insertQuery, values;

    if (parentReplyId) {
        // 대댓글일 경우 처리
        insertQuery = `
            INSERT INTO recipe_reply (user_id, recipe_id, parent_reply_id, content)
            VALUES (?, ?, ?, ?)
        `;
        values = [userId, recipeId, parentReplyId, content];
    } else {
        // 댓글일 경우 처리
        insertQuery = `
            INSERT INTO recipe_reply (user_id, recipe_id, content, picture, rating)
            VALUES (?, ?, ?, ?, ?)
        `;
        values = [userId, recipeId, content, picturePath, rating];
    }

    db.query(insertQuery, values, (error, results) => {
        if (error) {
            console.error('댓글 삽입 오류:', error);
            return res.status(500).json({ success: false, message: '서버 오류' });
        }

        res.status(200).json({ success: true, message: '댓글이 성공적으로 등록되었습니다.' });
    });
});
app.post('/toggleView', (req, res) => {
    const userId = req.session.user ? req.session.user.id : null;
    const recipeId = req.body.recipeId;

    if (!userId) {
        return res.status(200).json({ success: false, message: '로그인 후 이용해 주세요.' });
    }

    const checkLikeQuery = `SELECT * FROM good WHERE user_id = ? AND recipe_id = ?`;
    db.query(checkLikeQuery, [userId, recipeId], (error, results) => {
        if (error) {
            console.error('Error checking like status:', error);
            res.json({ success: false, message: 'Error checking like status' });
            return;
        }
        if (results.length > 0) {
            res.json({ success: true, isPicked: true });
        }else{
            res.json({ success: true, isPicked: false });
        }
    })
})
app.post('/togglePick', (req, res) => {
    const userId = req.session.user ? req.session.user.id : null;
    const recipeId = req.body.recipeId;

    const checkLikeQuery = `SELECT * FROM good WHERE user_id = ? AND recipe_id = ?`;
    db.query(checkLikeQuery, [userId, recipeId], (error, results) => {
        if (error) {
            console.error('Error checking like status:', error);
            res.json({ success: false, message: 'Error checking like status' });
            return;
        }

        let isPicked = false;

        if (results.length > 0) {
            // 이미 좋아요를 누른 상태
            isPicked = true;
            // 좋아요 취소 로직 - 데이터베이스에서 해당 레코드 삭제
            const deleteLikeQuery = `DELETE FROM good WHERE user_id = ? AND recipe_id = ?`;
            db.query(deleteLikeQuery, [userId, recipeId], (deleteError, deleteResults) => {
                if (deleteError) {
                    console.error('Error deleting like:', deleteError);
                    res.json({ success: false, message: 'Error deleting like' });
                    return;
                }
                // 여기서 연결을 닫지 않음
                res.json({ success: true, isPicked: false });
            });
        } else {
            // 좋아요 추가 로직 - 데이터베이스에 새로운 레코드 삽입
            const insertLikeQuery = `INSERT INTO good (user_id, recipe_id) VALUES (?, ?)`;
            db.query(insertLikeQuery, [userId, recipeId], (insertError, insertResults) => {
                if (insertError) {
                    console.error('Error inserting like:', insertError);
                    res.json({ success: false, message: 'Error inserting like' });
                    return;
                }
                // 여기서 연결을 닫지 않음
                res.json({ success: true, isPicked: true });
            });
        }
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