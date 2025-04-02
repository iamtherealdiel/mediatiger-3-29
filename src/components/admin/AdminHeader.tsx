import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';

interface AdminHeaderProps {
  handleSignOut: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ handleSignOut }) => {
  return (
    <div className="flex justify-between items-center mb-4 md:mb-8">
      <Link
        to="/"
        className="inline-flex items-center text-slate-400 hover:text-white"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to home
      </Link>
      <button
        onClick={handleSignOut}
        className="text-red-400 hover:text-red-300 flex items-center"
      >
        <span className="mr-2">Sign Out</span>
        <Lock className="h-4 w-4" />
      </button>
    </div>
  );
};