export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">SPUP Research Ethics Committee</h3>
            <p className="text-gray-400 text-sm">
              Primary reviewers are integral to the ethical review process, providing expert assessment of research protocols.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Primary Reviewer Resources</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Reviewer Guidelines</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Ethics Framework</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Form Templates</a></li>
              <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact REC Office</h3>
            <address className="text-gray-400 text-sm not-italic">
              St. Paul University Philippines<br />
              Mabini St., Tuguegarao City<br />
              Cagayan, Philippines 3500<br /><br />
              Email: rec@spup.edu.ph<br />
              Phone: +63 (078) 123-4567
            </address>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>© {new Date().getFullYear()} St. Paul University Philippines Research Ethics Committee. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
} 