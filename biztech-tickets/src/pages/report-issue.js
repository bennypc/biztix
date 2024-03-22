import React, { useState } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const IssueForm = () => {
  const [issue, setIssue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setIssue('');

    try {
      const response = await axios.post('/api/reportIssue', { issue });
      toast.success('Issue reported successfully!', {
        position: 'bottom-center',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'dark'
      });
    } catch (error) {
      console.error('Failed to submit issue:', error);
      setMessage('Failed to submit the issue. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className='bg-[#070f21] min-h-screen'>
        <div className='flex min-h-full flex-1 flex-col justify-center px-6 py-24 lg:px-8'>
          <div className='sm:mx-auto sm:w-full sm:max-w-sm'>
            <img className='mx-auto h-36 w-auto' src='/biztechlogo.png' />
            <h2 className='mt-2 text-center text-2xl font-bold leading-9 tracking-tight text-white'>
              Report an issue
            </h2>
          </div>

          <div className='mt-6 sm:mx-auto sm:w-full sm:max-w-sm'>
            <form className='space-y-6' action='#' method='POST'>
              <div>
                <div className='flex items-center justify-between'>
                  {/* <label className='block text-sm font-medium leading-6 text-white'>
                    Report an issue{' '}
                  </label> */}
                </div>
                <div className='mt-2'>
                  <textarea
                    id='issue'
                    rows={4}
                    value={issue}
                    onChange={(e) => setIssue(e.target.value)}
                    required
                    placeholder='Please be detailed as possible...'
                    className='px-3 block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6'
                  />
                </div>
              </div>

              <div>
                <button
                  onClick={handleSubmit}
                  className='flex w-full justify-center rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500'
                >
                  Report Issue{' '}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <ToastContainer
        position='bottom-center'
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme='dark'
      />
    </div>
  );
};

export default IssueForm;
