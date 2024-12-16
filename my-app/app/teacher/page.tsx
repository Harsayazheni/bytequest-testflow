import { revalidatePath } from 'next/cache'
import fs from 'fs/promises'
import path from 'path'
import { cache } from 'react'

const questionsPath = path.join(process.cwd(), 'data', 'questions.json')
const gradesPath = path.join(process.cwd(), 'data', 'grades.json')
const studentAnswersPath = path.join(process.cwd(), 'data', 'student-answers.json')

async function ensureFileExists(filePath: string) {
  try {
    await fs.access(filePath)
  } catch (error) {
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, '[]')
  }
}

async function readJsonFile(filePath: string) {
  await ensureFileExists(filePath)
  const fileContent = await fs.readFile(filePath, 'utf-8')
  return JSON.parse(fileContent)
}

async function writeJsonFile(filePath: string, data: any) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2))
}

async function addQuestion(formData: FormData) {
  'use server'
  const question = formData.get('question')
  const answer = formData.get('answer')

  const questions = await readJsonFile(questionsPath)
  questions.push({ question, answer, id: Date.now() })
  await writeJsonFile(questionsPath, questions)
  revalidatePath('/teacher')
}

async function addMultipleQuestions(formData: FormData) {
  'use server'
  const questionsData = formData.get('questions')
  if (typeof questionsData !== 'string') {
    throw new Error('Invalid questions data')
  }

  const newQuestions = questionsData.split('\n').map(line => {
    const [question, answer] = line.split('|').map(s => s.trim())
    return { question, answer, id: Date.now() + Math.random() }
  }).filter(q => q.question && q.answer)

  const questions = await readJsonFile(questionsPath)
  questions.push(...newQuestions)
  await writeJsonFile(questionsPath, questions)
  revalidatePath('/teacher')
}

async function gradeAnswer(formData: FormData) {
  'use server'
  const id = formData.get('id')
  const grade = formData.get('grade')

  const grades = await readJsonFile(gradesPath)
  grades.push({ id, grade })
  await writeJsonFile(gradesPath, grades)
  revalidatePath('/teacher')
}

async function getQuestions() {
  return readJsonFile(questionsPath)
}

const getStudentAnswers = cache(async () => {
  return readJsonFile(studentAnswersPath)
})

async function getQuestionWithStudentAnswer(questionId: string) {
  const questions = await getQuestions()
  const studentAnswers = await getStudentAnswers()
  const question = questions.find((q: any) => q.id.toString() === questionId)
  const studentAnswer = studentAnswers.find((a: any) => a.id === questionId)
  return {
    ...question,
    studentAnswer: studentAnswer ? studentAnswer.answer : null
  }
}

export default async function TeacherPage() {
  const questions = await getQuestions()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Teacher Section</h1>
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Add a Single Question</h2>
        <form action={addQuestion} className="space-y-4">
          <div>
            <label htmlFor="question" className="block mb-1">Question:</label>
            <input type="text" id="question" name="question" required className="w-full p-2 border rounded" />
          </div>
          <div>
            <label htmlFor="answer" className="block mb-1">Correct Answer:</label>
            <input type="text" id="answer" name="answer" required className="w-full p-2 border rounded" />
          </div>
          <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
            Add Question
          </button>
        </form>
      </div>
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Add Multiple Questions</h2>
        <form action={addMultipleQuestions} className="space-y-4">
          <div>
            <label htmlFor="questions" className="block mb-1">Questions and Answers:</label>
            <textarea 
              id="questions" 
              name="questions" 
              required 
              className="w-full p-2 border rounded h-40"
              placeholder="Question 1 | Answer 1&#10;Question 2 | Answer 2&#10;Question 3 | Answer 3"
            ></textarea>
          </div>
          <p className="text-sm text-gray-600">Enter each question and its answer on a new line, separated by a | character.</p>
          <button type="submit" className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
            Add Multiple Questions
          </button>
        </form>
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2">Grade Answers</h2>
        {questions.length === 0 ? (
          <p>No questions available. Add some questions to get started.</p>
        ) : (
          <div>
            {questions.map((q: any) => (
              <QuestionWithAnswer key={q.id} questionId={q.id.toString()} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

async function QuestionWithAnswer({ questionId }: { questionId: string }) {
  const questionData = await getQuestionWithStudentAnswer(questionId)

  return (
    <div className="mb-4 p-4 border rounded">
      <p><strong>Question:</strong> {questionData.question}</p>
      {questionData.studentAnswer !== null ? (
        <>
          <p><strong>Student's Answer:</strong> {questionData.studentAnswer}</p>
          <form action={gradeAnswer} className="mt-2">
            <input type="hidden" name="id" value={questionData.id} />
            <input type="number" name="grade" min="0" max="100" required className="p-2 border rounded mr-2" placeholder="Grade (0-100)" />
            <button type="submit" className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
              Submit Grade
            </button>
          </form>
        </>
      ) : (
        <p>No answer submitted yet.</p>
      )}
    </div>
  )
}

