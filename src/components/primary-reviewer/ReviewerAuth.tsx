import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';
import { ReviewersService } from "@/lib/reviewers/reviewers.service";
import { useRouter } from "next/navigation";

export default function ReviewerAuth() {
  const [reviewerCode, setReviewerCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReviewerCode(e.target.value.toUpperCase());
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const service = ReviewersService.getInstance();
    const reviewer = await service.getReviewerByCode(reviewerCode);

    setLoading(false);

    if (!reviewer) {
      setError("Invalid or inactive reviewer code. Please check and try again.");
      return;
    }

    router.push("/primary-reviewer/dashboard");
  };

  return (
    <div className="relative bg-primary text-white">
      <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-10"></div>
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 sm:py-24 lg:px-8 relative z-10">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl mb-6">
            Primary Reviewer Portal
          </h1>
          <p className="max-w-3xl mx-auto text-xl text-primary-100 mb-10">
            Access and manage your assigned research protocol reviews efficiently
          </p>
          {error && (
            <div className="text-white bg-red-500/80 py-2 px-4 rounded-md max-w-md mx-auto mb-6">
              {error}
            </div>
          )}
          <div className="mt-10 sm:flex sm:justify-center">
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row items-center max-w-xl w-full mx-auto border-2 border-white rounded-lg overflow-hidden shadow-xl"
            >
              <div className="relative flex-1 w-full">
                <User
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                  size={24}
                />
                <Input
                  type="text"
                  placeholder="Enter your reviewer code"
                  value={reviewerCode}
                  onChange={handleInputChange}
                  className="pl-12 h-16 w-full text-lg bg-white text-black border-none focus:ring-0 rounded-none"
                  autoFocus
                />
              </div>
              <Button
                type="submit"
                className="w-full sm:w-auto h-16 px-8 text-lg font-medium bg-white text-primary hover:bg-gray-100 border-t-2 sm:border-t-0 sm:border-l-2 border-white focus:ring-0 rounded-none"
                disabled={loading}
              >
                {loading ? "Checking..." : "Enter Portal"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 