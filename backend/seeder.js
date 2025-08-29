// backend/seeder.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/userModel');
const Grant = require('./models/grantModel');
const Application = require('./models/applicationModel');
const Organization = require('./models/organizationModel');
const connectDB = require('./config/db');

dotenv.config();

connectDB();

const importData = async () => {
    try {
        // Clear existing data
        await Application.deleteMany();
        await Grant.deleteMany();
        await User.deleteMany();
        await Organization.deleteMany();

        // Create Organization
        const org = await Organization.create({ name: 'Tech for Good Foundation' });

        // Create Users
        const superAdmin = await User.create({
            name: 'Super Admin',
            email: 'superadmin@example.com',
            password: 'password123',
            role: 'Super Admin',
            verificationStatus: 'Verified',
        });

        const grantMaker = await User.create({
            name: 'Grant Maker',
            email: 'grantmaker@example.com',
            password: 'password123',
            role: 'Grant Maker',
            organization: org._id,
            organizationRole: 'Admin',
            verificationStatus: 'Verified',
        });
        
        org.admins.push(grantMaker._id);
        org.members.push(grantMaker._id);
        await org.save();

        const reviewer = await User.create({
            name: 'Reviewer One',
            email: 'reviewer@example.com',
            password: 'password123',
            role: 'Reviewer',
            organization: org._id,
            organizationRole: 'Member',
            verificationStatus: 'Verified',
        });
        org.members.push(reviewer._id);
        await org.save();

        const approver = await User.create({
            name: 'Approver One',
            email: 'approver@example.com',
            password: 'password123',
            role: 'Approver',
            organization: org._id,
            organizationRole: 'Member',
            verificationStatus: 'Verified',
        });
        org.members.push(approver._id);
        await org.save();

        const applicant1 = await User.create({
            name: 'Alice Applicant',
            email: 'applicant1@example.com',
            password: 'password123',
            role: 'Applicant',
            verificationStatus: 'Verified',
        });

        const applicant2 = await User.create({
            name: 'Bob Applicant',
            email: 'applicant2@example.com',
            password: 'password123',
            role: 'Applicant',
            verificationStatus: 'Pending',
        });

        console.log('Users Imported!');

        // Create Grants
        const grant1 = await Grant.create({
            title: 'Community Garden Initiative',
            description: 'Funding for community gardens in urban areas.',
            amount: 5000,
            category: 'Environment',
            deadline: new Date('2025-12-31'),
            status: 'Active',
            grantMaker: grantMaker._id,
            reviewers: [reviewer._id],
            approvers: [approver._id],
            applicationQuestions: [
                { questionText: 'Describe your community garden plan.', questionType: 'textarea', points: 20 },
                { questionText: 'What is your estimated budget?', questionType: 'number', points: 10 },
            ],
        });

        const grant2 = await Grant.create({
            title: 'Youth STEM Education Program',
            description: 'Support for programs that teach STEM skills to young students.',
            amount: 10000,
            category: 'Education',
            deadline: new Date('2025-11-30'),
            status: 'Active',
            grantMaker: grantMaker._id,
            reviewers: [reviewer._id],
            applicationQuestions: [
                { questionText: 'Outline your STEM curriculum.', questionType: 'textarea', points: 25 },
            ],
        });
        
        const draftGrant = await Grant.create({
            title: 'Arts & Culture Festival (Draft)',
            description: 'A draft grant for a future arts festival.',
            amount: 7500,
            category: 'Arts',
            deadline: new Date('2026-01-31'),
            status: 'Draft',
            grantMaker: grantMaker._id,
        });

        console.log('Grants Imported!');

        // Create Applications
        await Application.create({
            grant: grant1._id,
            applicant: applicant1._id,
            grantMaker: grantMaker._id,
            status: 'Submitted',
            answers: [
                { questionId: grant1.applicationQuestions[0]._id, questionText: 'Describe your community garden plan.', answer: 'We plan to build a rooftop garden.' },
                { questionId: grant1.applicationQuestions[1]._id, questionText: 'What is your estimated budget?', answer: 4500 },
            ],
        });

        console.log('Sample Data Imported!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await Application.deleteMany();
        await Grant.deleteMany();
        await User.deleteMany();
        await Organization.deleteMany();
        console.log('Data Destroyed!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

if (process.argv[2] === '-d') {
    destroyData();
} else {
    importData();
}
