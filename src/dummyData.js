const { faker } = require('@faker-js/faker');
const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

// db연결
const db = mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
});

db.connect(err => {

    function maskPhone(phone) {
        // 1) 숫자만 추출
        const digits = String(phone).replace(/[^0-9]/g, "");
        if (digits.length !== 11) {
            throw new Error("올바른 11자리 휴대폰 번호를 입력하세요");
        }
    
        // 2) 정규식으로 앞 3자리(010)만 남기고 나머지는 ****로 치환
        return digits.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
    }

    if (err) {
        return console.error(err);
    }

    const dummyData = JSON.parse(
        fs.readFileSync(path.join(__dirname, 'dummyDataList.json'), 'utf8')
    );

    // 더미 데이터 리스트
    // ["디지털기기","가구","도서","옷","스포츠"]
    const categoryNames = Object.keys(dummyData); 
    const categoryMap = categoryNames.reduce((m, name, i) => {
        m[name] = i;
        return m;
    }, {});

    // 시간은 5달 동안 들어온걸 기준으로 할게요!
    let endDate = new Date();
    let startDate = new Date(); // 한 달 전 날짜 출력
    startDate.setMonth(startDate.getMonth() - 4);
    console.log(endDate, startDate)

    const products = [];

    for (let i = 0; i < 100; i++) {
        const catName = categoryNames[Math.floor(Math.random() * categoryNames.length)];
        const catId = categoryMap[catName];
        const titles = dummyData[catName];
        const title = titles[Math.floor(Math.random() * titles.length)];
        const yearsUsed = Math.floor(Math.random() * 3) + 1;
        const contents = `${yearsUsed}년 사용했고 깨끗하게 잘 사용했습니다! 싸게 사가세요`;

        const product = {
            img_id: 0,
            title: title,
            category_id: catId+1,
            user_id: Math.floor(Math.random() * 20),
            price: faker.commerce.price({ min: 0, max: 1000, dec: 0 }) + "000",
            contents: contents,
            created_at: faker.date.between({from:startDate,to:endDate})
        };

        products.push(product);
    }

    const users = [];
    for (let i = 0; i < 20; i++) {
        const random8 = Math.floor(Math.random() * 100000000)
        .toString()
        .padStart(8, "0");
        users.push({
            img_id: 0,
            password: faker.internet.password(8),
            email: faker.internet.email(),
            contact: maskPhone(`010${random8}`),
            name: faker.person.fullName(),
            nickname: faker.internet.username(),
            contents: faker.lorem.sentence(),
            created_at: faker.date.between({from:startDate,to:endDate}),
            salt: i,
        });
    }

    /* 나중에 더미데이터를 크롤링해서 파일을 넣을려고 한다면..

    const filePath = path.join(__dirname, 'products.json');
    
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('JSON 파일 읽기 에러:', err);
            db.end();
            return;
        }
        
        try{ 
    **/

    let sql = "INSERT INTO items (img_id, title, category_id, user_id, price, contents, created_at) VALUES ?";
    let values = products.map(product => [
        product.img_id,
        product.title,
        product.category_id,
        product.user_id,
        product.price,
        product.contents,
        product.created_at
    ]);
    // console.log(values)

    db.query(sql, [values], (err, results)=>{
        if (err) console.log(err);

        db.end(err => {
            if (err) console.log(err)
        })
    })

    sql = `INSERT INTO users
        (img_id, password, email, contact, name, nickname, contents, created_at, salt) VALUES ?`
    values = users.map(user =>[
        user.img_id,
        user.password,
        user.email,
        user.contact,
        user.name,
        user.nickname,
        user.contents,
        user.created_at,
        user.salt
    ])

    db.query(sql, [values], (err, results)=>{
        if (err) console.log(err);

        db.end(err => {
            if (err) console.log(err)
        })
    })

    sql = `INSERT INTO categories
        (category_name) VALUES ?`
    values = categoryNames.map(value=>[value])

    db.query(sql, [values], (err, results)=>{
        if (err) console.log(err);

        db.end(err => {
            if (err) console.log(err)
        })
    })

    function generateLikes(userCount = 20, itemCount = 100, minLikes = 5) {
        const likes = [];
        for (let userId = 1; userId <= userCount; userId++) {
            // user 당 좋아요 개수를 minLikes ~ itemCount 사이에서 랜덤 결정
            const numLikes = faker.number.int({ min: minLikes, max: itemCount });

            // 1~itemCount 배열을 섞어서 앞 numLikes 개를 선택
            const items = Array.from({ length: itemCount }, (_, i) => i + 1);
            for (let i = items.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [items[i], items[j]] = [items[j], items[i]];
            }
            const chosen = items.slice(0, numLikes);

            // 선택된 아이템들을 [item_id, user_id] 튜플로 푸쉬
            chosen.forEach(itemId => {
                likes.push([itemId, userId]);
            });
        }
        return likes;
    }
    
    // 사용 예
    const likesRows = generateLikes(20, 100, 5);

    sql = `INSERT INTO likes (item_id, user_id) VALUES ?`
    values =[likesRows]

    db.query(sql, values, (err, results)=>{
        if (err) console.log(err);

        db.end(err => {
            if (err) console.log(err)
        })
    })
    /* 
    } catch (err) {
        console.log(err);
        db.end();
    }
    **/
})