import { Link } from 'react-router-dom';
import { Mic, Edit, BookOpen, Headphones, Target, Clock, BarChart3, Play } from 'lucide-react';

const modules = [
  {
    name: 'Speaking',
    icon: Mic,
    color: 'blue',
    description: 'Improve your pronunciation, fluency, and content',
    sections: [
      { name: 'Read Aloud', questions: 45, duration: '35-40 sec' },
      { name: 'Repeat Sentence', questions: 60, duration: '15 sec' },
      { name: 'Describe Image', questions: 50, duration: '40 sec' },
      { name: 'Retell Lecture', questions: 40, duration: '40 sec' },
      { name: 'Answer Short Question', questions: 55, duration: '10 sec' },
    ],
  },
  {
    name: 'Writing',
    icon: Edit,
    color: 'purple',
    description: 'Master essay writing and text summarization',
    sections: [
      { name: 'Summarize Written Text', questions: 35, duration: '10 min' },
      { name: 'Essay Writing', questions: 40, duration: '20 min' },
    ],
  },
  {
    name: 'Reading',
    icon: BookOpen,
    color: 'green',
    description: 'Enhance comprehension and vocabulary',
    sections: [
      { name: 'Multiple Choice (Single)', questions: 45, duration: '2 min' },
      { name: 'Multiple Choice (Multiple)', questions: 40, duration: '2 min' },
      { name: 'Reorder Paragraphs', questions: 35, duration: '2-3 min' },
      { name: 'Fill in the Blanks (R)', questions: 50, duration: '2 min' },
      { name: 'Fill in the Blanks (R&W)', questions: 48, duration: '2-3 min' },
    ],
  },
  {
    name: 'Listening',
    icon: Headphones,
    color: 'orange',
    description: 'Train your listening comprehension skills',
    sections: [
      { name: 'Summarize Spoken Text', questions: 30, duration: '10 min' },
      { name: 'Multiple Choice (Single)', questions: 42, duration: '1-2 min' },
      { name: 'Multiple Choice (Multiple)', questions: 38, duration: '1-2 min' },
      { name: 'Fill in the Blanks', questions: 45, duration: '1-2 min' },
      { name: 'Highlight Correct Summary', questions: 35, duration: '2 min' },
      { name: 'Select Missing Word', questions: 32, duration: '1 min' },
      { name: 'Highlight Incorrect Words', questions: 40, duration: '2-3 min' },
      { name: 'Write from Dictation', questions: 52, duration: '3-5 min' },
    ],
  },
];

export function PracticePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 px-4 pb-12">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Practice Modules</h1>
          <p className="text-gray-600 dark:text-gray-400">Choose a module to start practicing</p>
        </div>

        <div className="space-y-6">
          {modules.map((module, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className={`bg-gradient-to-r from-${module.color}-500 to-${module.color}-600 p-6 text-white`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-lg">
                      <module.icon className="h-8 w-8" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{module.name}</h2>
                      <p className="text-white/90">{module.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">{module.sections.reduce((sum, s) => sum + s.questions, 0)}</div>
                    <div className="text-white/90">Total Questions</div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {module.sections.map((section, sectionIndex) => (
                    <Link
                      key={sectionIndex}
                      to={`/practice/${module.name.toLowerCase()}/${section.name.toLowerCase().replace(/\s+/g, '-')}`}
                      className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 hover:shadow-lg transition-all group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-lg group-hover:text-blue-600 transition-colors">
                          {section.name}
                        </h3>
                        <Play className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      </div>
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          <span>{section.questions} questions</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{section.duration}</span>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Your Progress</span>
                          <span className="text-blue-600 font-semibold">
                            {Math.floor(Math.random() * 100)}%
                          </span>
                        </div>
                        <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r from-${module.color}-500 to-${module.color}-600`}
                            style={{ width: `${Math.floor(Math.random() * 100)}%` }}
                          />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
