import { revalidatePath } from 'next/cache'
import fs from 'fs/promises'
import path from 'path'

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

async function submitAnswer(formData: FormData) {
  'use server'
  const id = formData.get('id')
  const answer = formData.get('answer')

  const answers = await readJsonFile(studentAnswersPath)
  const existingAnswerIndex = answers.findIndex((a: any) => a.id === id)
  
  if (existingAnswerIndex !== -1) {
    answers[existingAnswerIndex].answer = answer
  } else {
    answers.push({ id, answer })
  }
  
  await writeJsonFile(studentAnswersPath, answers)
  revalidatePath('/student')
}

async function getQuestions() {
  return readJsonFile(questionsPath)
}

async function getGrades() {
  return readJsonFile(gradesPath)
}

export default async function StudentPage() {
  const questions = await getQuestions()
  const grades = await getGrades()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Student Section</h1>
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Take the Test</h2>
        {questions.length === 0 ? (
          <p>No questions available. Please check back later when the teacher has added some questions.</p>
        ) : (
          questions.map((q: any) => (
            <div key={q.id} className="mb-4 p-4 border rounded">
              <p><strong>Question:</strong> {q.question}</p>
              <form action={submitAnswer} className="mt-2">
                <input type="hidden" name="id" value={q.id} />
                <input type="text" name="answer" required className="w-full p-2 border rounded mb-2" placeholder="Your answer" />
                <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
                  Submit Answer
                </button>
              </form>
            </div>
          ))
        )}
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2">Your Grades</h2>
        {grades.length === 0 ? (
          <p>No grades available yet. Complete the test and wait for your teacher to grade your answers.</p>
        ) : (
          grades.map((g: any) => {
            const question = questions.find((q: any) => q.id.toString() === g.id)
            return (
              <div key={g.id} className="mb-4 p-4 border rounded">
                <p><strong>Question:</strong> {question ? question.question : 'N/A'}</p>
                <p><strong>Grade:</strong> {g.grade}</p>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

