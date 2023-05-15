// 모듈 가져오기
import express from 'express'
import bodyParser from 'body-parser'
import Sequelize from 'sequelize'

// MySQL 연결 설정
const sequelize = new Sequelize('student', 'root', '1234', {//student스키마에 root계정 비밀번호 1234
    dialect: 'mysql',// 사용할 데이터베이스 종류
    host: 'localhost',// 접속할 데이터베이스 호스트 주소
    port: 3306,// 접속할 데이터베이스의 포트
});


// Student, Grade 모델 생성
const Student = sequelize.define('student', { //student 테이블에
    id: {//id필드를 생성
        type: Sequelize.INTEGER, //int
        primaryKey: true, //primary 키 설정
        autoIncrement: true,  // 숫자가 자동으로 증가하게
    },
    student_number: {// student_number 필드를 생성
        type: Sequelize.STRING, // 스트링
        unique: true, // 유니크키 설정
    },
    name: { //name필드 생성
        type: Sequelize.STRING, // 스트링
    },
    phone: {//phone필드 생성
        type: Sequelize.STRING,// 스트링
    },
    email: {//email필드 생성
        type: Sequelize.STRING,// 스트링
    },
    address: {//address 필드 생성
        type: Sequelize.STRING,// 스트링
    }
});

const Grade = sequelize.define('grade', {//grade 테이블에 필드 생성하기
    studentId: {//studentId필드 생성
        type: Sequelize.INTEGER,//int
        primaryKey: true,//프라이머리키
        autoIncrement: true,//숫자 자동증가
    },
    java: {//java필드 생성
        type: Sequelize.INTEGER,//int
    },
    python: {//python 생성
        type: Sequelize.INTEGER,//int
    },
    c: {//c 생성
        type: Sequelize.INTEGER,//int
    },
    total: {//total 생성
        type: Sequelize.INTEGER,//int
    },
    average: {//average 생성
        type: Sequelize.INTEGER,//int
    },
});

const INCLUDE_STUDENT = {// 테이블 조인해서 보여줄때
    attributes: [//속성값으로는
        "id",//id 필드 
        "student_number",//학번필드
        "name",//이름
        "phone",//폰
        "email",//이메일
        "address",//주소
        "createdAt",//생성날자를 보여주고
        [
            Sequelize.literal(//쿼리문을 속성값으로 지정한다.
                "(SELECT java FROM Grades WHERE studentId = Student.id)"//그레이드 테이블의 자바필드에서 student아이디가 student테이블의 id값과 같은 자바
            ),
            "java"
        ],
        [
            Sequelize.literal(
                "(SELECT python FROM Grades WHERE studentId = Student.id)"//그레이드 테이블의 자바필드에서 student아이디가 student테이블의 id값과 같은 파이썬점수
            ),
            "python"
        ],
        [
            Sequelize.literal("(SELECT c FROM Grades WHERE studentId = Student.id)"),//그레이드 테이블의 자바필드에서 student아이디가 student테이블의 id값과 같은 c점수
            "c"
        ],
        [
            Sequelize.literal(
                "(SELECT total FROM Grades WHERE studentId = Student.id)"//그레이드 테이블의 자바필드에서 student아이디가 student테이블의 id값과 같은 총점
            ),
            "total"
        ],
        [
            Sequelize.literal(
                "(SELECT average FROM Grades WHERE studentId = Student.id)"//그레이드 테이블의 자바필드에서 student아이디가 student테이블의 id값과 같은 평균점수
            ),
            "average"
        ]
    ]
};
// join 시키기
// Student 모델
Student.hasMany(Grade, { foreignKey: 'studentId' });// belongsTo만 사용했을때 foreinkey설정이 재대로 되지않아 오류가 발생하여 student테이블에서도 같이 걸어줌

// Grade 모델
Grade.belongsTo(Student, { foreignKey: 'studentId' });//student테이블에 조인시키기



// HTTP 서버 설정
const app = express();//express모듈을 변수에 저장하여 사용
app.use(bodyParser.json());// 클라이언트에서 서버로 전달된 body부분을 도와주는 미들웨어
app.use(bodyParser.urlencoded({ extended: true }));//urlencoded() 메소드는 폼(form) 형식으로 전달된 요청의 body 추출, extended옵션은 key=value 형식 이외의 데이터를  querystring 모듈을 사용하여 다양한 데이터 처리가 가능하다

// 학생 등록 API
app.post('/student', async (req, res) => {// student를 post방식으로 접속하였을때
    try {//오류처리
        const { student_number, name, phone, email, address } = req.body;//body에서 전달받은 값을 각각에 변수에 담기
        await Student.create({//json형태로 저장한다.
            student_number: student_number,// 키와 밸류값이 같아 생략도 가능
            name: name,
            phone: phone,
            email: email,
            address: address
        });
        res.send('학생 등록 완료');
    } catch (e) {// 오류처리2
        console.error(e);
        res.status(500).send('입력값을 확인해주세요!');
    }
});

// 모든 학생 조회 API
app.get('/student', async (req, res) => {//student를 get방식으로 접속하였을때
    try {
        // 등록된 전체 학생 수 구하기
        const total = await Student.count();

        // 모든 학생 정보와 함께 시험 점수를 가져옵니다.
        const studentsWithGrades = await Student.findAll({//Student에서 전체를 가져온다.
            attributes: {//속성값으로는
                include: [
                    [
                        Sequelize.fn('SUM', Sequelize.col('Grades.total')),//학생의 총점을 계산하여
                        'total'//total로 별명주기
                    ],
                ]
            },
            include: INCLUDE_GRADE,// include옵션을 이용해 grade를 같이 조회
            group: ['Student.id']//student의  id컬럼을 기준으로 그룹지정
        });

        // 모든 학생의 시험 점수를 배열에 담습니다.
        const scores = studentsWithGrades.map(studentWithGrades => studentWithGrades.getDataValue('total'));

        // 모든 점수를 기준으로 석차 구하기
        const ranks = calcRanks(scores);

        // 각 학생별 석차와 시험 점수를 계산합니다.
        const resultWithRank = studentsWithGrades.map(studentWithGrades => {
            const total = studentWithGrades.getDataValue('total');// 총점 가져오기
            const rank = ranks[scores.indexOf(total)] + 1;//총점으로 순위를 매겨서 +1 해주어 원래 등수가 나올수 있게 해주기
            return {
                rank: rank,//석차 반환후
                ...studentWithGrades.toJSON(),//student전체 가져온것을 복사하여 json형식으로 반환
            };
        });

        // 결과를 석차 기준으로 정렬합니다.
        resultWithRank.sort((a, b) => {
            if (a.rank !== b.rank) {// 석차가 같지 않을경우에는 석차로 소트
                return a.rank - b.rank;
            } else {
                return b.student_number - a.student_number;//석차가 같을경우에는 학번으로 소트해주기
            }
        });
        res.json({//제이슨 형식으로
            total: total,//총점과
            students: resultWithRank,//학생정보 반환받은것을 출력
        });

    } catch (e) {//에러처리
        console.error(e);
        res.status(500).send('서버 에러!');
    }
});

// 모든 점수를 기준으로 석차 반환해주기
function calcRanks(scores) {
    const sortedScores = scores.slice().sort((a, b) => b - a); // 점수를 내림차순으로 정렬합니다.
    const ranks = scores.map(score => sortedScores.indexOf(score)); // 각 점수에 대한 순위를 계산합니다.
    return ranks;
}

// grade 같이 보여주기 
const INCLUDE_GRADE = [
    {
        model: Grade,//Grade모델에서
        attributes: {
            exclude: ['id', 'studentId'],//두가지가 제외되어서 나오게 하기
        }
    }
];



// 학생 검색 API
app.get('/student/:student_number', async (req, res) => {//학생의 아이디로 접속하였을때
    try {
        const student = await Student.findOne({//학번으로 학생을 찾아서
            where: { student_number: req.params.student_number },//학번을 기준으로 검색
            include: { model: Grade },//점수랑 같이 보여주기
        });
        const grade = await Grade.findOne({//성적도 같이 찾아와서 반환시켜주기
            where: { studentId: student.id },
        });

        const subquery = `(SELECT SUM(total) FROM Grades WHERE studentId != ${student.id})`;//본인 제외 나머지 학생들의 시험점수 합
        const rank = await Grade.count({
            where: {
                total: {
                    [Sequelize.Op.gt]: Sequelize.literal(subquery),// 총점이 서브쿼리보다 큰 학생들을 찾아서 1을 더한값이 본인의 석차
                },
            },
        }) + 1;

        const totalStudents = await Student.count();//총 인원수
        res.json({//제이슨 형태로 반환
            id: student.id,
            student_number: student.student_number,
            name: student.name,
            phone: student.phone,
            email: student.email,
            address: student.address,
            createdAt: student.createdAt,
            rank: rank,
            total_students: totalStudents,
            grade
        });
    } catch (e) {//오류 처리
        console.error(e);
        res.status(500).send('서버 에러!');
    }
});



// 학생 수정 API
app.put('/student/:id', async (req, res) => {//put을 이용하여 아이디로 접근
    try {
        const { student_number, name, phone, email, address, createdAt } = req.body;// 바디 부분에서 각각에 저장
        const student = await Student.findByPk(req.params.id, {// 학생의 아이디로 찾아서
            where: { id: req.params.id },
            include: { model: Grade },
        });
        if (student) {//학생이 존재하면 재 저장해줌
            student.student_number = student_number ?? student.student_number;
            student.name = name ?? student.name;
            student.phone = phone ?? student.phone;
            student.email = email ?? student.email;
            student.address = address ?? student.address;
            student.createdAt = createdAt ?? student.createdAt;
            await student.save();
            res.send('학생 정보 수정 완료');
        } else {//없으면 오류처리
            res.status(404).send('학생을 찾을 수 없습니다.');
        }
    } catch (e) {
        console.error(e);
        res.status(500).send('입력값 확인 에러!(학번이 중복되었을수도 있음)');
    }
});

// 학생 삭제 API
app.delete('/student/:id', async (req, res) => {
    try {
        const student = await Student.findByPk(req.params.id);//아이디를 찾아서 삭제 진행

        if (student) {//존재하면 성적을 먼저 삭제하고 학생테이블을 삭제해서 foreinkey 오류 나는거 방지
            // 학생의 성적을 먼저 삭제합니다.
            await Grade.destroy({
                where: { studentId: req.params.id }
            });

            // 학생을 삭제합니다.
            await student.destroy();
            res.send('학생 삭제 완료');
        } else {
            res.status(404).send('학생을 찾을 수 없습니다.');
        }
    } catch (e) {
        console.error(e);
        res.status(500).send('서버 에러!');
    }
});


// 성적 등록 API
app.post('/grade/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const { java, python, c, createdAt } = req.body;
        const total = java + python + c;//총점은 세과목을 더한 값을 저장하여주고
        const average = Math.round(total / 3);//총점에서 3으로 나눠준다
        await Grade.create({//그후 성적 등록해주기
            studentId: id,//ai를 걸어줬지만 id랑 같은 값이 들어가게 하여 성적이 2중으로 들어가는것 방지
            java: java,
            python: python,
            c: c,
            createdAt: createdAt,
            total: total,
            average: average,
        });
        res.send('성적 등록 완료');
    } catch (e) {
        console.error(e);
        res.status(500).send('아이디 중복 에러!or학생이 없을수도 있습니다!');
    }
});


// 성적 수정 API
app.put('/grade/:id', async (req, res) => {
    try {
        const { java, python, c, createdAt } = req.body;
        // const student = await Student.findByPk(req.params.id, {
        //     where: { id: req.params.id },
        //     include: { model: Grade },
        // });
        const grade = await Grade.findByPk(req.params.id, { where: { studentId: req.params.id } });
        if (grade) {
            grade.java = java ?? grade.java;
            grade.python = python ?? grade.python;
            grade.c = c ?? grade.c;
            grade.createdAt = createdAt ?? grade.createdAt;
            grade.total = grade.java + grade.python + grade.c;
            grade.average = Math.round(grade.total / 3);
            await grade.save();
            res.send('성적 정보 수정 완료');
        } else {
            res.status(404).send('성적을 찾을 수 없습니다.');
        }
    } catch (e) {
        console.error(e);
        res.status(500).send('서버 에러!');
    }
});

// 성적 삭제 API
app.delete('/grade/:id', async (req, res) => {
    try {
        const grade = await Grade.findByPk(req.params.id, { where: { studentId: req.params.id } });
        if (grade) {
            await grade.destroy();
            res.send('성적 삭제 완료');
        } else {
            res.status(404).send('성적을 찾을 수 없습니다.');
        }
    } catch (e) {
        console.error(e);
        res.status(500).send('서버 에러!');
    }
});


// 시작할때 테이블 같이 생성해주기
sequelize.sync()
    .then(() => {
        console.log('데이터베이스 연결 성공');
    })
    .catch((err) => {
        console.error(err);
    });


// 서버 시작
app.listen(8080, () => {
    console.log('서버가 시작되었습니다.');
});
