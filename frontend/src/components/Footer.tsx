const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-primary-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">⚓</span>
            </div>
            <span className="text-lg font-semibold">BlackFlag HR</span>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            Secure enterprise HR management system.
          </p>
          <p className="text-gray-400 text-sm">
            &copy; {currentYear} BlackFlag HR. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer



