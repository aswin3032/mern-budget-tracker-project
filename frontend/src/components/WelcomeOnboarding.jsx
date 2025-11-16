import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SparklesIcon, CogIcon } from '@heroicons/react/24/outline';

export default function WelcomeOnboarding() {
  return (
    <motion.div
      className="bg-white p-8 rounded-2xl shadow-lg text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <SparklesIcon className="mx-auto h-12 w-12 text-primary" />
      <h2 className="mt-4 text-2xl font-bold text-gray-900">
        Welcome to Your New Dashboard!
      </h2>
      <p className="mt-2 text-gray-600">
        Let's get your financial journey started. The first step is to create a spending category.
      </p>

      <div className="mt-8">
        <Link
          to="/settings"
          className="btn-primary inline-flex items-center gap-2"
        >
          <CogIcon className="h-5 w-5" />
          Create Your First Category
        </Link>
      </div>
      <p className="mt-4 text-xs text-gray-400">
        (e.g., Groceries, Transport, Bills)
      </p>
    </motion.div>
  );
}