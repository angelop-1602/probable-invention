"use client";
import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "@/components/ui/Icons";

/**
 * FAQSection component for the proponent landing page
 * Displays frequently asked questions with expandable answers
 */
export function FAQSection() {
  const faqs = [
    {
      question: "What's the difference between an Application Code and SPUP REC Code?",
      answer: "The Application Code is generated immediately upon submission and is used to track your application. The SPUP REC Code is assigned by the REC Chair after confirming your submission is complete, and follows the format SPUP_YYYY_NNNN_TR_FL."
    },
    {
      question: "How do I check the status of my submission?",
      answer: "Enter your Application Code in the tracking section at the top of this page. The system will display your current status, including which stage of the review process your submission is in."
    },
    {
      question: "What should I do if my application requires revisions?",
      answer: "If revisions are required, you'll receive detailed feedback from the reviewers. Access your application through the tracking system, and you'll find instructions for submitting revised documents along with Form 08A (Resubmission Form)."
    },
    {
      question: "How often should I submit Progress Reports?",
      answer: "The frequency of Progress Reports depends on the nature of your research and will be specified in your approval letter. Typically, they are required every 3-6 months, but this may vary. You'll need to submit Form 09B for Progress Reports."
    },
    {
      question: "How long does the review process take?",
      answer: "The review timeline varies depending on the complexity of your protocol and the completeness of your submission. Generally, initial review takes 2-4 weeks after submission, but this can vary. You can always check your current status using the tracking system."
    }
  ];

  // State to track which FAQ is expanded
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Toggle FAQ open/closed
  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="py-16 bg-gray-50 scroll-mt-20" id="faqs">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            Common questions about the protocol submission and review process
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className="mb-4 border border-gray-200 rounded-lg overflow-hidden bg-white"
            >
              <button
                className="w-full px-6 py-4 text-left flex justify-between items-center focus:outline-none hover:bg-gray-50"
                onClick={() => toggleFAQ(index)}
                aria-expanded={openIndex === index}
              >
                <span className="font-medium text-gray-800">{faq.question}</span>
                {openIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>

              {openIndex === index && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600">
            Still have questions?{" "}
            <a href="mailto:rec.support@spup.edu.ph" className="text-primary hover:underline">
              Contact the REC Support Team
            </a>
          </p>
        </div>
      </div>
    </div>
  );
} 