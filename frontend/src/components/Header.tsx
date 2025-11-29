import { Link } from 'react-router-dom'

const Header = () => {
  return (
    <header className="bg-white shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">⚓</span>
            </div>
            <span className="text-xl font-bold text-gray-900">BlackFlag HR</span>
          </Link>
        </div>
      </nav>
    </header>
  )
}

export default Header



