"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const express_1 = __importDefault(require("express"));
const prisma_1 = __importDefault(require("../prisma"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Middleware to protect these routes
router.use(auth_1.auth);
// Get all subjects for logged-in user
router.get('/', async (req, res) => {
    try {
        const isArchived = req.query.archived === 'true';
        const subjects = await prisma_1.default.subject.findMany({
            where: {
                userId: req.user.id,
                isArchived: isArchived
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(subjects);
    }
    catch (error) {
        console.error('Error fetching subjects:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Create a new subject
router.post('/', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            res.status(400).json({ message: 'Name is required' });
            return;
        }
        const subject = await prisma_1.default.subject.create({
            data: {
                name,
                userId: req.user.id
            }
        });
        res.status(201).json(subject);
    }
    catch (error) {
        console.error('Error creating subject:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Toggle archive status
router.patch('/:id/archive', async (req, res) => {
    try {
        const { id } = req.params;
        const { isArchived } = req.body;
        const subject = await prisma_1.default.subject.findUnique({ where: { id } });
        if (!subject) {
            res.status(404).json({ message: 'Subject not found' });
            return;
        }
        if (subject.userId !== req.user.id) {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }
        const updatedSubject = await prisma_1.default.subject.update({
            where: { id },
            data: { isArchived }
        });
        res.json(updatedSubject);
    }
    catch (error) {
        console.error('Error updating subject archive status:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.default = router;
//# sourceMappingURL=subjects.js.map