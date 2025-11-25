// import { PrismaClient, Prisma } from '@prisma/client';
// import * as bcrypt from 'bcrypt';
// import { randomBytes } from 'crypto';
// import {
//     MaterialCategory,
//     QuestionType,
//     DifficultyLevel,
//     ProgrammingLanguage,
//     AssignmentType,
//     AttendanceStatus,
//     NotificationType,
// } from "@prisma/client";

// const prisma = new PrismaClient();

// // Utility functions
// function randomInt(min: number, max: number): number {
//   return Math.floor(Math.random() * (max - min + 1)) + min;
// }

// function randomElement<T>(array: T[]): T {
//   return array[randomInt(0, array.length - 1)];
// }

// function randomDate(start: Date, end: Date): Date {
//   return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
// }

// function generateStudentCode(): string {
//   return `SV${randomInt(100000, 999999)}`;
// }

// function generateTeacherCode(): string {
//   return `GV${randomInt(10000, 99999)}`;
// }

// function generateSubjectCode(): string {
//   return `MON${randomInt(1000, 9999)}`;
// }

// async function hashPassword(password: string): Promise<string> {
//   return bcrypt.hash(password, 10);
// }

// async function clearDatabase() {
//   console.log('🧹 Clearing database...');
  
//   // Delete in reverse order of dependencies
//   await prisma.auditLog.deleteMany();
//   await prisma.learningItem.deleteMany();
//   await prisma.learningPath.deleteMany();
//   await prisma.reminder.deleteMany();
//   await prisma.notification.deleteMany();
//   await prisma.chatMessage.deleteMany();
//   await prisma.chatParticipant.deleteMany();
//   await prisma.chatRoom.deleteMany();
//   await prisma.forumPost.deleteMany();
//   await prisma.forumThread.deleteMany();
//   await prisma.gradeColumnLink.deleteMany();
//   await prisma.studentGrade.deleteMany();
//   await prisma.gradeColumnAssignment.deleteMany();
//   await prisma.gradeColumnAttendanceSession.deleteMany();
//   await prisma.gradeColumn.deleteMany();
//   await prisma.attendanceLog.deleteMany();
//   await prisma.deviceFingerprint.deleteMany();
//   await prisma.attendanceNonce.deleteMany();
//   await prisma.attendanceScoreRule.deleteMany();
//   await prisma.attendance.deleteMany();
//   await prisma.attendanceSession.deleteMany();
//   await prisma.submissionAnswer.deleteMany();
//   await prisma.submission.deleteMany();
//   await prisma.testCase.deleteMany();
//   await prisma.questionChoice.deleteMany();
//   await prisma.assignmentQuestion.deleteMany();
//   await prisma.question.deleteMany();
//   await prisma.sectionAssignment.deleteMany();
//   await prisma.assignment.deleteMany();
//   await prisma.chapter.deleteMany();
//   await prisma.courseMaterial.deleteMany();
//   await prisma.material.deleteMany();
//   await prisma.sectionEnrollment.deleteMany();
//   await prisma.sectionGroup.deleteMany();
//   await prisma.sectionInstructor.deleteMany();
//   await prisma.subjectInstructor.deleteMany();
//   await prisma.courseSection.deleteMany();
//   await prisma.term.deleteMany();
//   await prisma.subject.deleteMany();
//   await prisma.teacher.deleteMany();
//   await prisma.student.deleteMany();
//   await prisma.refreshToken.deleteMany();
//   await prisma.user.deleteMany();
//   await prisma.rolePermission.deleteMany();
//   await prisma.role.deleteMany();
//   await prisma.permission.deleteMany();

//   console.log('✅ Database cleared');
// }

// async function seedPermissions() {
//   console.log('🔐 Seeding Permissions...');
  
//   const permissionGroups = [
//     {
//       groupName: 'User Management',
//       permissions: [
//         { name: 'user.create', description: 'Create new users' },
//         { name: 'user.read', description: 'View user information' },
//         { name: 'user.update', description: 'Update user information' },
//         { name: 'user.delete', description: 'Delete users' },
//       ],
//     },
//     {
//       groupName: 'Course Management',
//       permissions: [
//         { name: 'course.create', description: 'Create new courses' },
//         { name: 'course.read', description: 'View course information' },
//         { name: 'course.update', description: 'Update course information' },
//         { name: 'course.delete', description: 'Delete courses' },
//       ],
//     },
//     {
//       groupName: 'Assignment Management',
//       permissions: [
//         { name: 'assignment.create', description: 'Create assignments' },
//         { name: 'assignment.read', description: 'View assignments' },
//         { name: 'assignment.update', description: 'Update assignments' },
//         { name: 'assignment.delete', description: 'Delete assignments' },
//         { name: 'assignment.grade', description: 'Grade assignments' },
//       ],
//     },
//     {
//       groupName: 'Attendance Management',
//       permissions: [
//         { name: 'attendance.create', description: 'Create attendance sessions' },
//         { name: 'attendance.read', description: 'View attendance records' },
//         { name: 'attendance.update', description: 'Update attendance records' },
//       ],
//     },
//   ];

//   const createdPermissions = [];
//   for (const group of permissionGroups) {
//     for (const perm of group.permissions) {
//       const permission = await prisma.permission.create({
//         data: {
//           name: perm.name,
//           description: perm.description,
//           groupName: group.groupName,
//         },
//       });
//       createdPermissions.push(permission);
//     }
//   }

//   console.log(`✅ Created ${createdPermissions.length} permissions`);
//   return createdPermissions;
// }

// async function seedRoles(permissions: any[]) {
//   console.log('👥 Seeding Roles...');

//   const roles = [
//     {
//       name: 'admin',
//       description: 'System Administrator',
//       permissionNames: permissions.map(p => p.name),
//     },
//     {
//       name: 'teacher',
//       description: 'Teacher/Instructor',
//       permissionNames: [
//         'course.read', 'course.update',
//         'assignment.create', 'assignment.read', 'assignment.update', 'assignment.grade',
//         'attendance.create', 'attendance.read', 'attendance.update',
//       ],
//     },
//     {
//       name: 'student',
//       description: 'Student',
//       permissionNames: [
//         'course.read',
//         'assignment.read',
//         'attendance.read',
//       ],
//     },
//   ];

//   const createdRoles = [];
//   for (const roleData of roles) {
//     const role = await prisma.role.create({
//       data: {
//         name: roleData.name,
//         description: roleData.description,
//       },
//     });

//     // Assign permissions to role
//     const rolePermissions = permissions
//       .filter(p => roleData.permissionNames.includes(p.name))
//       .map(p => ({
//         roleId: role.id,
//         permissionId: p.id,
//       }));

//     await prisma.rolePermission.createMany({
//       data: rolePermissions,
//     });

//     createdRoles.push(role);
//   }

//   console.log(`✅ Created ${createdRoles.length} roles`);
//   return createdRoles;
// }

// async function seedUsers(roles: any[]) {
//   console.log('👤 Seeding Users...');

//   const adminRole = roles.find(r => r.name === 'admin')!;
//   const teacherRole = roles.find(r => r.name === 'teacher')!;
//   const studentRole = roles.find(r => r.name === 'student')!;

//   const defaultPassword = await hashPassword('Password123!');

//   // Create Admin
//   const admin = await prisma.user.create({
//     data: {
//       email: 'admin@university.edu',
//       passwordHash: defaultPassword,
//       fullName: 'System Administrator',
//       roleId: adminRole.id,
//       isActive: true,
//       emailVerified: true,
//     },
//   });

//   // Create Teachers
//   const teachers = [];
//   const teacherNames = [
//     'Nguyễn Văn An', 'Trần Thị Bình', 'Lê Văn Cường', 
//     'Phạm Thị Dung', 'Hoàng Văn Em', 'Vũ Thị Phương',
//     'Đặng Văn Giang', 'Bùi Thị Hà', 'Đinh Văn Hùng',
//     'Mai Thị Lan'
//   ];

//   for (let i = 0; i < 10; i++) {
//     const teacherCode = generateTeacherCode();
//     const user = await prisma.user.create({
//       data: {
//         studentCode: teacherCode,
//         email: `teacher${i + 1}@university.edu`,
//         passwordHash: defaultPassword,
//         fullName: teacherNames[i],
//         phone: `090${randomInt(1000000, 9999999)}`,
//         dateOfBirth: randomDate(new Date('1970-01-01'), new Date('1990-12-31')),
//         roleId: teacherRole.id,
//         isActive: true,
//         emailVerified: true,
//         teacher: {
//           create: {
//             teacherCode,
//             department: randomElement(['Computer Science', 'Mathematics', 'Physics', 'Engineering']),
//             position: randomElement(['Lecturer', 'Senior Lecturer', 'Associate Professor', 'Professor']),
//             specialization: randomElement(['Algorithms', 'Database Systems', 'AI/ML', 'Web Development', 'Networks']),
//           },
//         },
//       },
//       include: { teacher: true },
//     });
//     teachers.push(user);
//   }

//   // Create Students
//   const students = [];
//   const firstNames = ['An', 'Bình', 'Cường', 'Dũng', 'Em', 'Phương', 'Giang', 'Hà', 'Hùng', 'Lan'];
//   const lastNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đinh', 'Mai'];
//   const majors = ['Computer Science', 'Software Engineering', 'Information Systems', 'Data Science'];
//   const classes = ['CNTT-K15A', 'CNTT-K15B', 'CNTT-K16A', 'CNTT-K16B'];

//   for (let i = 0; i < 100; i++) {
//     const studentCode = generateStudentCode();
//     const fullName = `${randomElement(lastNames)} ${randomElement(firstNames)} ${String.fromCharCode(65 + randomInt(0, 25))}`;
    
//     const user = await prisma.user.create({
//       data: {
//         studentCode,
//         email: `${studentCode.toLowerCase()}@student.university.edu`,
//         passwordHash: defaultPassword,
//         fullName,
//         phone: `091${randomInt(1000000, 9999999)}`,
//         dateOfBirth: randomDate(new Date('2000-01-01'), new Date('2005-12-31')),
//         roleId: studentRole.id,
//         isActive: true,
//         emailVerified: true,
//         student: {
//           create: {
//             studentCode,
//             className: randomElement(classes),
//             major: randomElement(majors),
//             academicYear: randomElement(['2021-2022', '2022-2023', '2023-2024']),
//             enrollmentYear: randomInt(2021, 2023),
//             gpa: parseFloat((2.5 + Math.random() * 1.5).toFixed(2)),
//             status: randomElement(['active', 'active', 'active', 'suspended']),
//           },
//         },
//       },
//       include: { student: true },
//     });
//     students.push(user);
//   }

//   console.log(`✅ Created 1 admin, ${teachers.length} teachers, ${students.length} students`);
//   return { admin, teachers, students };
// }

// async function seedSubjects(teachers: any[]) {
//   console.log('📚 Seeding Subjects...');

//   const subjectData = [
//     { name: 'Introduction to Programming', credits: 4, description: 'Basic programming concepts with Python' },
//     { name: 'Data Structures and Algorithms', credits: 4, description: 'Core data structures and algorithmic techniques' },
//     { name: 'Database Systems', credits: 3, description: 'Relational databases and SQL' },
//     { name: 'Web Development', credits: 3, description: 'HTML, CSS, JavaScript, and modern frameworks' },
//     { name: 'Object-Oriented Programming', credits: 4, description: 'OOP principles with Java' },
//     { name: 'Computer Networks', credits: 3, description: 'Network protocols and architecture' },
//     { name: 'Operating Systems', credits: 3, description: 'OS concepts and design' },
//     { name: 'Software Engineering', credits: 3, description: 'Software development lifecycle' },
//     { name: 'Machine Learning', credits: 4, description: 'Introduction to ML algorithms' },
//     { name: 'Mobile App Development', credits: 3, description: 'iOS and Android development' },
//   ];

//   const subjects = [];
//   for (const data of subjectData) {
//     const subject = await prisma.subject.create({
//       data: {
//         subjectCode: generateSubjectCode(),
//         subjectName: data.name,
//         credits: data.credits,
//         description: data.description,
//       },
//     });

//     // Assign 1-3 teachers to each subject
//     const assignedTeachers = teachers.slice(0, randomInt(1, 3));
//     for (const teacher of assignedTeachers) {
//       await prisma.subjectInstructor.create({
//         data: {
//           subjectId: subject.id,
//           teacherId: teacher.teacher.id,
//           role: teacher === assignedTeachers[0] ? 'owner' : randomElement(['co', 'ta']),
//         },
//       });
//     }

//     subjects.push(subject);
//   }

//   console.log(`✅ Created ${subjects.length} subjects`);
//   return subjects;
// }

// async function seedChapters(subjects: any[]) {
//   console.log('📖 Seeding Chapters...');

//   const chapters = [];
//   for (const subject of subjects) {
//     const chapterCount = randomInt(5, 10);
//     for (let i = 1; i <= chapterCount; i++) {
//       const chapter = await prisma.chapter.create({
//         data: {
//           subjectId: subject.id,
//           chapterCode: `CH${i.toString().padStart(2, '0')}`,
//           chapterName: `Chapter ${i}: Topic ${i}`,
//           description: `Learning materials for chapter ${i}`,
//           order: i,
//         },
//       });
//       chapters.push(chapter);
//     }
//   }

//   console.log(`✅ Created ${chapters.length} chapters`);
//   return chapters;
// }

// async function seedTerms() {
//   console.log('📅 Seeding Terms...');

//   const terms = [];
//   const years = [2023, 2024, 2025];
//   const semesters = [1, 2, 3]; // 1: Fall, 2: Spring, 3: Summer

//   for (const year of years) {
//     for (const sem of semesters) {
//       const semesterName = sem === 1 ? 'Fall' : sem === 2 ? 'Spring' : 'Summer';
//       const startMonth = sem === 1 ? 8 : sem === 2 ? 1 : 5;
//       const endMonth = sem === 1 ? 12 : sem === 2 ? 5 : 7;

//       const term = await prisma.term.create({
//         data: {
//           code: `${year}${sem}`,
//           name: `${semesterName} ${year}`,
//           startDate: new Date(year, startMonth - 1, 1),
//           endDate: new Date(year, endMonth, 0),
//         },
//       });
//       terms.push(term);
//     }
//   }

//   console.log(`✅ Created ${terms.length} terms`);
//   return terms;
// }

// async function seedCourseSections(subjects: any[], terms: any[], teachers: any[]) {
//   console.log('🏫 Seeding Course Sections...');

//   const sections = [];
//   for (const subject of subjects) {
//     const term = randomElement(terms);
//     const sectionCount = randomInt(1, 3);

//     for (let i = 1; i <= sectionCount; i++) {
//       const section = await prisma.courseSection.create({
//         data: {
//           subjectId: subject.id,
//           termId: term.id,
//           sectionCode: `${subject.subjectCode}-${String(i).padStart(2, '0')}`,
//           sectionName: `Section ${i}`,
//           schedule: {
//             days: randomElement([['Monday', 'Wednesday'], ['Tuesday', 'Thursday'], ['Friday']]),
//             time: randomElement(['08:00-10:00', '10:00-12:00', '13:00-15:00', '15:00-17:00']),
//             room: `Room ${randomInt(100, 500)}`,
//           },
//           maxStudents: randomInt(30, 60),
//           currentStudents: 0,
//           status: randomElement(['planned', 'ongoing', 'ongoing', 'completed']),
//         },
//       });

//       // Assign instructors
//       const assignedTeachers = teachers.slice(0, randomInt(1, 2));
//       for (const teacher of assignedTeachers) {
//         await prisma.sectionInstructor.create({
//           data: {
//             sectionId: section.id,
//             teacherId: teacher.teacher.id,
//             role: teacher === assignedTeachers[0] ? 'owner' : 'co',
//           },
//         });
//       }

//       sections.push(section);
//     }
//   }

//   console.log(`✅ Created ${sections.length} course sections`);
//   return sections;
// }

// async function seedSectionGroups(sections: any[]) {
//   console.log('👥 Seeding Section Groups...');

//   const groups = [];
//   for (const section of sections) {
//     const groupCount = randomInt(3, 6);
//     for (let i = 1; i <= groupCount; i++) {
//       const group = await prisma.sectionGroup.create({
//         data: {
//           sectionId: section.id,
//           groupCode: `G${i.toString().padStart(2, '0')}`,
//           groupName: `Group ${i}`,
//           maxMembers: randomInt(4, 8),
//           isActive: true,
//         },
//       });
//       groups.push({ ...group, sectionId: section.id });
//     }
//   }

//   console.log(`✅ Created ${groups.length} section groups`);
//   return groups;
// }

// async function seedEnrollments(sections: any[], students: any[], groups: any[]) {
//   console.log('✍️ Seeding Enrollments...');

//   let enrollmentCount = 0;
//   for (const section of sections) {
//     const enrollCount = Math.min(randomInt(20, 40), students.length);
//     const enrolledStudents = students.slice(0, enrollCount);
//     const sectionGroups = groups.filter(g => g.sectionId === section.id);

//     for (const student of enrolledStudents) {
//       const group = randomElement(sectionGroups);
//       await prisma.sectionEnrollment.create({
//         data: {
//           sectionId: section.id,
//           studentId: student.student.id,
//           groupId: group.id,
//           status: randomElement(['enrolled', 'enrolled', 'enrolled', 'completed']),
//         },
//       });
//       enrollmentCount++;
//     }

//     // Update current students count
//     await prisma.courseSection.update({
//       where: { id: section.id },
//       data: { currentStudents: enrollCount },
//     });
//   }

//   console.log(`✅ Created ${enrollmentCount} enrollments`);
// }

// async function seedMaterials(users: any[]) {
//   console.log('📄 Seeding Materials...');

//   const materials = [];
//   const categories: MaterialCategory[] = [MaterialCategory.lecture, MaterialCategory.slide, MaterialCategory.exercise, MaterialCategory.reference, MaterialCategory.syllabus];
//   const fileTypes = ['pdf', 'pptx', 'docx', 'zip'];

//   for (let i = 0; i < 50; i++) {
//     const fileType = randomElement(fileTypes);
//     const material = await prisma.material.create({
//       data: {
//         title: `Study Material ${i + 1}`,
//         description: `Description for material ${i + 1}`,
//         fileName: `material_${i + 1}.${fileType}`,
//         filePath: `/uploads/materials/material_${i + 1}.${fileType}`,
//         fileSize: BigInt(randomInt(100000, 10000000)),
//         fileType: fileType,
//         originalMaterialId: randomBytes(16).toString('hex'),
//         category: randomElement(categories),
//         isPublic: randomInt(0, 1) === 1,
//         downloadCount: randomInt(0, 500),
//         uploadedBy: randomElement(users).id,
//       },
//     });
//     materials.push(material);
//   }

//   console.log(`✅ Created ${materials.length} materials`);
//   return materials;
// }

// async function seedCourseMaterials(sections: any[], materials: any[], users: any[]) {
//   console.log('🔗 Linking Materials to Courses...');

//   let linkCount = 0;
//   for (const section of sections) {
//     const materialCount = randomInt(3, 8);
//     const selectedMaterials = materials.slice(0, materialCount);

//     for (const material of selectedMaterials) {
//       await prisma.courseMaterial.create({
//         data: {
//           courseSectionId: section.id,
//           materialId: material.id,
//           assignedBy: randomElement(users.filter(u => u.teacher)).id,
//           isOpen: randomInt(0, 1) === 1,
//         },
//       });
//       linkCount++;
//     }
//   }

//   console.log(`✅ Created ${linkCount} course material links`);
// }

// async function seedQuestions(subjects: any[], chapters: any[]) {
//   console.log('❓ Seeding Questions...');

//   const questions = [];
//   const questionTypes: QuestionType[] = [QuestionType.multiple_choice, QuestionType.essay, QuestionType.coding, QuestionType.true_false];
//   const difficulties: DifficultyLevel[] = [DifficultyLevel.easy, DifficultyLevel.medium, DifficultyLevel.hard];
//   const languages: ProgrammingLanguage[] = [ProgrammingLanguage.javascript, ProgrammingLanguage.python, ProgrammingLanguage.java, ProgrammingLanguage.cpp];

//   for (let i = 0; i < 200; i++) {
//     const type = randomElement(questionTypes);
//     const chapter = randomElement(chapters);
    
//     const question = await prisma.question.create({
//       data: {
//         type,
//         content: `Question ${i + 1}: What is the correct answer?`,
//         explanation: `Explanation for question ${i + 1}`,
//         points: randomInt(1, 5),
//         order: i + 1,
//         subjectId: chapter.subjectId,
//         chapterId: chapter.id,
//         difficulty: randomElement(difficulties),
//         tags: JSON.stringify(['tag1', 'tag2', 'tag3']),
//         language: type === QuestionType.coding ? randomElement(languages) : null,
//         starterCode: type === 'coding' ? '// Write your code here\n' : null,
//         timeLimit: type === 'coding' ? randomInt(1000, 5000) : null,
//         memoryLimit: type === 'coding' ? randomInt(128, 512) : null,
//       },
//     });

//     // Add choices for multiple choice and true/false
//     if (type === QuestionType.multiple_choice) {
//       const choiceCount = randomInt(3, 5);
//       for (let j = 0; j < choiceCount; j++) {
//         await prisma.questionChoice.create({
//           data: {
//             questionId: question.id,
//             content: `Option ${String.fromCharCode(65 + j)}`,
//             isCorrect: j === 0, // First option is correct
//             order: j + 1,
//           },
//         });
//       }
//     } else if (type === QuestionType.true_false) {
//       await prisma.questionChoice.createMany({
//         data: [
//           { questionId: question.id, content: 'True', isCorrect: true, order: 1 },
//           { questionId: question.id, content: 'False', isCorrect: false, order: 2 },
//         ],
//       });
//     }

//     // Add test cases for coding questions
//     if (type === QuestionType.coding) {
//       const testCaseCount = randomInt(3, 6);
//       for (let j = 0; j < testCaseCount; j++) {
//         await prisma.testCase.create({
//           data: {
//             questionId: question.id,
//             input: `input${j + 1}`,
//             expectedOutput: `output${j + 1}`,
//             isHidden: j >= 2, // First 2 are visible
//             points: randomInt(1, 3),
//             order: j + 1,
//           },
//         });
//       }
//     }

//     questions.push(question);
//   }

//   console.log(`✅ Created ${questions.length} questions with choices and test cases`);
//   return questions;
// }

// async function seedAssignments(subjects: any[], chapters: any[], questions: any[]) {
//   console.log('📝 Seeding Assignments...');

//   const assignments = [];
//   const types: AssignmentType[] = [AssignmentType.exercise, AssignmentType.quiz, AssignmentType.project, AssignmentType.exam];

//   for (let i = 0; i < 50; i++) {
//     const subject = randomElement(subjects);
//     const chapter = randomElement(chapters.filter(c => c.subjectId === subject.id));
//     const type = randomElement(types);

//     const assignment = await prisma.assignment.create({
//       data: {
//         title: `${type.charAt(0).toUpperCase() + type.slice(1)} ${i + 1}`,
//         description: `Description for assignment ${i + 1}`,
//         type,
//         dueDate: randomDate(new Date(), new Date('2025-12-31')),
//         maxScore: randomInt(50, 100),
//         passingScore: randomInt(40, 60),
//         timeLimit: type === 'quiz' || type === 'exam' ? randomInt(30, 120) : null,
//         isPublic: randomInt(0, 1) === 1,
//         maxAttempts: randomInt(1, 3),
//         shuffleQuestions: randomInt(0, 1) === 1,
//         showAnswersAfterSubmit: randomInt(0, 1) === 1,
//         allowLateSubmission: randomInt(0, 1) === 1,
//         createdBy: 1, // Admin
//         originalAssignmentId: randomBytes(16).toString('hex'),
//         subjectId: subject.id,
//         chapterId: chapter?.id,
//       },
//     });

//     // Add questions to assignment
//     const questionCount = randomInt(5, 15);
//     const selectedQuestions = questions
//       .filter(q => q.subjectId === subject.id)
//       .slice(0, questionCount);

//     for (const question of selectedQuestions) {
//       await prisma.assignmentQuestion.create({
//         data: {
//           assignmentId: assignment.id,
//           questionId: question.id,
//         },
//       });
//     }

//     assignments.push(assignment);
//   }

//   console.log(`✅ Created ${assignments.length} assignments`);
//   return assignments;
// }

// async function seedSectionAssignments(sections: any[], assignments: any[]) {
//   console.log('🔗 Linking Assignments to Sections...');

//   let linkCount = 0;
//   for (const section of sections) {
//     const assignmentCount = randomInt(3, 8);
//     const selectedAssignments = assignments.slice(0, assignmentCount);

//     for (const assignment of selectedAssignments) {
//       await prisma.sectionAssignment.create({
//         data: {
//           sectionId: section.id,
//           assignmentId: assignment.id,
//           isOpen: randomInt(0, 1) === 1,
//         },
//       });
//       linkCount++;
//     }
//   }

//   console.log(`✅ Created ${linkCount} section assignment links`);
// }

// async function seedAttendanceSessions(sections: any[]) {
//   console.log('✅ Seeding Attendance Sessions...');

//   const sessions = [];
//   for (const section of sections) {
//     const sessionCount = randomInt(10, 20);
//     for (let i = 1; i <= sessionCount; i++) {
//       const session = await prisma.attendanceSession.create({
//         data: {
//           sectionId: section.id,
//           name: `Session ${i}`,
//           sessionCode: `${section.sectionCode}-S${i.toString().padStart(2, '0')}-${randomBytes(4).toString('hex')}`,
//           qrCodeUrl: `https://example.com/qr/${randomBytes(8).toString('hex')}`,
//           latitude: 10.7626 + (Math.random() - 0.5) * 0.1,
//           longitude: 106.6825 + (Math.random() - 0.5) * 0.1,
//           radius: randomInt(30, 100),
//           expiresAt: randomDate(new Date(), new Date('2025-12-31')),
//           requireDeviceCheck: randomInt(0, 1) === 1,
//           maxCheckInsPerIP: randomInt(1, 5),
//         },
//       });
//       sessions.push(session);
//     }
//   }

//   console.log(`✅ Created ${sessions.length} attendance sessions`);
//   return sessions;
// }

// async function seedAttendances(sessions: any[], students: any[]) {
//   console.log('📝 Seeding Attendances...');

//   let attendanceCount = 0;
//   const statuses: AttendanceStatus[] = [AttendanceStatus.present, AttendanceStatus.late, AttendanceStatus.absent, AttendanceStatus.warning];

//   for (const session of sessions) {
//     const attendeeCount = randomInt(15, 30);
//     const attendees = students.slice(0, attendeeCount);

//     for (const student of attendees) {
//       await prisma.attendance.create({
//         data: {
//           sessionId: session.id,
//           studentId: student.student.id,
//           status: randomElement(statuses),
//           checkedInAt: randomDate(new Date('2024-01-01'), new Date()),
//           latitude: session.latitude + (Math.random() - 0.5) * 0.01,
//           longitude: session.longitude + (Math.random() - 0.5) * 0.01,
//           distance: randomInt(0, 50),
//           ipAddress: `192.168.${randomInt(0, 255)}.${randomInt(1, 255)}`,
//           deviceInfo: randomElement(['iPhone 14', 'Samsung Galaxy S23', 'iPad Pro', 'MacBook Pro']),
//           isValid: randomInt(0, 1) === 1,
//           userAgent: 'Mozilla/5.0 (compatible)',
//           totpSecretBase32: randomBytes(16).toString('base64'),
//           totpPeriod: 10,
//           totpDigits: 6,
//         },
//       });
//       attendanceCount++;
//     }
//   }

//   console.log(`✅ Created ${attendanceCount} attendance records`);
// }

// async function seedGradeColumns(sections: any[]) {
//   console.log('📊 Seeding Grade Columns...');

//   const columns = [];
//   const types = ['attendance', 'assignment', 'midterm', 'final', 'participation', 'project'];

//   for (const section of sections) {
//     // Create main grade columns
//     const attendance = await prisma.gradeColumn.create({
//       data: {
//         sectionId: section.id,
//         name: 'Attendance',
//         type: 'attendance',
//         maxScore: 100,
//         weight: 0.1,
//         calculationMethod: 'average',
//         isPublished: true,
//         displayOrder: 1,
//       },
//     });

//     const assignments = await prisma.gradeColumn.create({
//       data: {
//         sectionId: section.id,
//         name: 'Assignments',
//         type: 'assignment',
//         maxScore: 100,
//         weight: 0.3,
//         calculationMethod: 'weighted_average',
//         isPublished: true,
//         displayOrder: 2,
//       },
//     });

//     const midterm = await prisma.gradeColumn.create({
//       data: {
//         sectionId: section.id,
//         name: 'Midterm Exam',
//         type: 'midterm',
//         maxScore: 100,
//         weight: 0.3,
//         calculationMethod: 'average',
//         isPublished: true,
//         displayOrder: 3,
//       },
//     });

//     const final = await prisma.gradeColumn.create({
//       data: {
//         sectionId: section.id,
//         name: 'Final Exam',
//         type: 'final',
//         maxScore: 100,
//         weight: 0.3,
//         calculationMethod: 'average',
//         isPublished: true,
//         displayOrder: 4,
//       },
//     });

//     columns.push(attendance, assignments, midterm, final);
//   }

//   console.log(`✅ Created ${columns.length} grade columns`);
//   return columns;
// }

// async function seedStudentGrades(gradeColumns: any[], students: any[]) {
//   console.log('💯 Seeding Student Grades...');

//   let gradeCount = 0;
//   for (const column of gradeColumns) {
//     const studentCount = randomInt(20, 30);
//     const gradedStudents = students.slice(0, studentCount);

//     for (const student of gradedStudents) {
//       const score = randomInt(50, 100);
//       await prisma.studentGrade.create({
//         data: {
//           gradeColumnId: column.id,
//           studentId: student.student.id,
//           score,
//           maxScore: column.maxScore,
//           percentage: (score / column.maxScore) * 100,
//           isOverridden: randomInt(0, 10) === 0,
//         },
//       });
//       gradeCount++;
//     }
//   }

//   console.log(`✅ Created ${gradeCount} student grades`);
// }

// async function seedForums(sections: any[], users: any[]) {
//   console.log('💬 Seeding Forum Threads and Posts...');

//   let threadCount = 0;
//   let postCount = 0;

//   for (const section of sections) {
//     const threads = randomInt(3, 8);
//     for (let i = 0; i < threads; i++) {
//       const thread = await prisma.forumThread.create({
//         data: {
//           sectionId: section.id,
//           title: `Discussion Topic ${i + 1}`,
//           content: `This is the content of discussion topic ${i + 1}`,
//           createdBy: randomElement(users).id,
//         },
//       });
//       threadCount++;

//       // Add posts to thread
//       const postNum = randomInt(2, 10);
//       for (let j = 0; j < postNum; j++) {
//         await prisma.forumPost.create({
//           data: {
//             threadId: thread.id,
//             content: `Reply ${j + 1} to the discussion`,
//             createdBy: randomElement(users).id,
//             votes: randomInt(-5, 20),
//           },
//         });
//         postCount++;
//       }
//     }
//   }

//   console.log(`✅ Created ${threadCount} forum threads and ${postCount} posts`);
// }

// async function seedChatRooms(sections: any[], groups: any[], assignments: any[]) {
//   console.log('💬 Seeding Chat Rooms...');

//   const rooms = [];

//   // Section chat rooms
//   for (const section of sections) {
//     const room = await prisma.chatRoom.create({
//       data: {
//         title: `${section.sectionName} Chat`,
//         type: 'section',
//         sectionId: section.id,
//       },
//     });
//     rooms.push({ ...room, entityId: section.id, entityType: 'section' });
//   }

//   // Group chat rooms
//   for (const group of groups.slice(0, 20)) {
//     const room = await prisma.chatRoom.create({
//       data: {
//         title: `${group.groupName} Chat`,
//         type: 'group',
//         groupId: group.id,
//       },
//     });
//     rooms.push({ ...room, entityId: group.id, entityType: 'group' });
//   }

//   // Assignment chat rooms
//   for (const assignment of assignments.slice(0, 10)) {
//     const room = await prisma.chatRoom.create({
//       data: {
//         title: `${assignment.title} Discussion`,
//         type: 'assignment',
//         assignmentId: assignment.id,
//       },
//     });
//     rooms.push({ ...room, entityId: assignment.id, entityType: 'assignment' });
//   }

//   console.log(`✅ Created ${rooms.length} chat rooms`);
//   return rooms;
// }

// async function seedChatMessages(rooms: any[], users: any[]) {
//   console.log('💬 Seeding Chat Messages...');

//   let messageCount = 0;
//   for (const room of rooms) {
//     const messages = randomInt(10, 50);
//     const participants = users.slice(0, randomInt(5, 15));

//     // Add participants
//     for (const participant of participants) {
//       await prisma.chatParticipant.create({
//         data: {
//           roomId: room.id,
//           userId: participant.id,
//         },
//       });
//     }

//     // Add messages
//     for (let i = 0; i < messages; i++) {
//       await prisma.chatMessage.create({
//         data: {
//           roomId: room.id,
//           senderId: randomElement(participants).id,
//           content: `Message ${i + 1} in ${room.title}`,
//           createdAt: randomDate(new Date('2024-01-01'), new Date()),
//         },
//       });
//       messageCount++;
//     }
//   }

//   console.log(`✅ Created ${messageCount} chat messages`);
// }

// async function seedNotifications(users: any[]) {
//   console.log('🔔 Seeding Notifications...');

//   let notificationCount = 0;
//   const types: NotificationType[] = [NotificationType.system, NotificationType.chat, NotificationType.assignment, NotificationType.section];

//   for (const user of users.slice(0, 50)) {
//     const notifCount = randomInt(5, 20);
//     for (let i = 0; i < notifCount; i++) {
//       await prisma.notification.create({
//         data: {
//           userId: user.id,
//           type: randomElement(types),
//           title: `Notification ${i + 1}`,
//           message: `This is notification message ${i + 1}`,
//           isRead: randomInt(0, 1) === 1,
//           createdAt: randomDate(new Date('2024-01-01'), new Date()),
//         },
//       });
//       notificationCount++;
//     }
//   }

//   console.log(`✅ Created ${notificationCount} notifications`);
// }

// async function main() {
//   console.log('🌱 Starting seed process...\n');

//   try {
//     await clearDatabase();

//     const permissions = await seedPermissions();
//     const roles = await seedRoles(permissions);
//     const { admin, teachers, students } = await seedUsers(roles);
//     const allUsers = [admin, ...teachers, ...students];

//     const subjects = await seedSubjects(teachers);
//     const chapters = await seedChapters(subjects);
//     const terms = await seedTerms();
//     const sections = await seedCourseSections(subjects, terms, teachers);
//     const groups = await seedSectionGroups(sections);
    
//     await seedEnrollments(sections, students, groups);

//     const materials = await seedMaterials(allUsers);
//     await seedCourseMaterials(sections, materials, allUsers);

//     const questions = await seedQuestions(subjects, chapters);
//     const assignments = await seedAssignments(subjects, chapters, questions);
//     await seedSectionAssignments(sections, assignments);

//     const attendanceSessions = await seedAttendanceSessions(sections);
//     await seedAttendances(attendanceSessions, students);

//     const gradeColumns = await seedGradeColumns(sections);
//     await seedStudentGrades(gradeColumns, students);

//     await seedForums(sections, allUsers);

//     const chatRooms = await seedChatRooms(sections, groups, assignments);
//     await seedChatMessages(chatRooms, allUsers);

//     await seedNotifications(allUsers);

//     console.log('\n✅ Seed completed successfully!');
//     console.log('\n📝 Test Accounts:');
//     console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
//     console.log('Admin:');
//     console.log('  Email: admin@university.edu');
//     console.log('  Password: Password123!');
//     console.log('\nTeacher:');
//     console.log('  Email: teacher1@university.edu');
//     console.log('  Password: Password123!');
//     console.log('\nStudent:');
//     console.log('  Email: (check database for student emails)');
//     console.log('  Password: Password123!');
//     console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

//   } catch (error) {
//     console.error('❌ Error during seed:', error);
//     throw error;
//   } finally {
//     await prisma.$disconnect();
//   }
// }

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   });