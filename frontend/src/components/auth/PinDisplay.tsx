import React, { useState, useEffect } from 'react';

interface PinDisplayProps {
 pin: string;
 onContinue: () => void;
}

const PinDisplay: React.FC<PinDisplayProps> = ({ pin, onContinue }) => {
 const [copied, setCopied] = useState(false);
 const [saved, setSaved] = useState(false);

 // Auto-save PIN to localStorage when component mounts
 useEffect(() => {
   try {
     localStorage.setItem('userSecurePin', pin);
     localStorage.setItem('pinSavedAt', new Date().toISOString());
     setSaved(true);
   } catch (error) {
     console.error('Failed to save PIN to localStorage:', error);
   }
 }, [pin]);

 const copyPin = () => {
   navigator.clipboard.writeText(pin);
   setCopied(true);
   setTimeout(() => setCopied(false), 2000);
 };

 const saveManually = () => {
   try {
     localStorage.setItem('userSecurePin', pin);
     localStorage.setItem('pinSavedAt', new Date().toISOString());
     setSaved(true);
   } catch (error) {
     console.error('Failed to save PIN to localStorage:', error);
   }
 };

 return (
   <div className="min-h-screen flex items-center justify-center p-6">
     <div className="w-full max-w-md animate-bounce-soft">
       <div className="card p-8 text-center">
         <div className="w-20 h-20 mx-auto mb-6 gradient-accent rounded-full flex items-center justify-center">
           <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3.586l4.293-4.293A6 6 0 0119 9z" />
           </svg>
         </div>
         
         <h1 className="text-2xl font-bold mb-4">Your Secure PIN</h1>
         <p className="text-muted-foreground mb-8">
           Save this PIN safely. You'll need it for future logins.
         </p>
         
         <div className="bg-surface p-6 rounded-xl mb-6">
           <div className="text-4xl font-mono font-bold tracking-wider mb-4">
             {pin}
           </div>
           <div className="flex gap-2 justify-center">
             <button
               onClick={copyPin}
               className="btn-ghost text-sm"
             >
               {copied ? 'Copied!' : 'Copy PIN'}
             </button>
             {!saved && (
               <button
                 onClick={saveManually}
                 className="btn-ghost text-sm"
               >
                 Save PIN
               </button>
             )}
           </div>
           {saved && (
             <p className="text-xs text-green-600 mt-2">
               ✓ PIN saved to browser storage
             </p>
           )}
         </div>

         <div className="bg-warning/10 p-4 rounded-lg mb-6">
           <div className="flex items-start gap-3">
             <svg className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
             </svg>
             <div className="text-sm">
               <p className="font-medium text-warning">Important</p>
               <p className="text-muted-foreground">
                 Store this PIN securely. It's your key to accessing your personal space.
               </p>
             </div>
           </div>
         </div>

         <button
           onClick={onContinue}
           className="btn-primary w-full"
         >
           I've Saved My PIN
         </button>
       </div>
     </div>
   </div>
 );
};

export default PinDisplay;