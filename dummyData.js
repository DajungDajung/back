const { faker } = require('@faker-js/faker');
const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { randomUUID } = require('crypto');
dotenv.config();

// db연결
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
});

db.connect(err => {

    function maskPhone(phone) {
        const digits = String(phone).replace(/[^0-9]/g, "");
        if (digits.length !== 11) {
            throw new Error("올바른 11자리 휴대폰 번호를 입력하세요");
        }
    
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

    // 이미지 추가!
    const imgNames = ["default","digital", "furniture", "books","clothes","sports"]

    for (let i = 0; i < 100; i++) {
        const catName = categoryNames[Math.floor(Math.random() * categoryNames.length)];
        const catId = categoryMap[catName];
        const titles = dummyData[catName];
        const title = titles[Math.floor(Math.random() * titles.length)];
        const yearsUsed = Math.floor(Math.random() * 3) + 1;
        const contents = `${yearsUsed}년 사용했고 깨끗하게 잘 사용했습니다! 싸게 사가세요`;

        const product = {
            img_id: catId+2,
            title: title,
            category_id: catId+1,
            user_id: Math.floor(Math.random() * 20)+1,
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
            img_id: 1,
            password: faker.internet.password(8),
            email: faker.internet.email(),
            contact: maskPhone(`010${random8}`),
            name: faker.person.fullName(),
            nickname: faker.internet.username(),
            info: faker.lorem.sentence(),
            created_at: faker.date.between({from:startDate,to:endDate}),
            salt: randomUUID(),
        });
    }

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

    const sql = `
        SET FOREIGN_KEY_CHECKS = 0;
        TRUNCATE images;
        TRUNCATE tokens;
        TRUNCATE categories;
        TRUNCATE users;
        TRUNCATE items;
        TRUNCATE likes;
        INSERT INTO images (url) VALUES ?;
        INSERT INTO categories (category_name) VALUES ?;
        INSERT INTO users (img_id, password, email, contact, name, nickname, info, created_at, salt) VALUES ?;
        INSERT INTO items (img_id, title, category_id, user_id, price, contents, created_at) VALUES ?;
        INSERT INTO likes (item_id, user_id) VALUES ?;
        SET FOREIGN_KEY_CHECKS = 1;
    `;

    let imgArr = imgNames.map(value => [`https://placehold.co/600x400?text=${value}`]);
    const categoriesArr = categoryNames.map(name => [ name ]);  

    const usersArr = users.map(u => {
        const ts = u.created_at.toISOString().slice(0,19).replace('T',' ');
        return [
            u.img_id, u.password, u.email, u.contact,
            u.name,  u.nickname, u.info,    ts,
            u.salt
        ];
    });
    
    const itemsArr = products.map(p => {
        const ts = p.created_at.toISOString().slice(0,19).replace('T',' ');
        return [
            p.img_id, p.title, p.category_id, p.user_id,
            p.price,  p.contents, ts
        ];
    });

    const values =[imgArr, categoriesArr, usersArr , itemsArr,likesRows]

    db.query(sql, values, (err, results)=>{
        if (err) console.log(err);
        console.log("완료!")
        db.end(err => {
            if (err) console.log(err)
        })
    })
})