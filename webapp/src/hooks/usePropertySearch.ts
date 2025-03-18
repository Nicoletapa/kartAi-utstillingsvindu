import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { PropertyIdentifiers, formatPropertyNumber, searchProperty } from '~/utils/propertyUtils';

export function usePropertySearch() {
  const { data: session, status } = useSession();
  const [userData, setUserData] = useState<PropertyIdentifiers | null>(null);
  const [searchInput, setSearchInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  
  const sessionProcessed = useRef(false);
  
  
  useEffect(() => {
    
    if (sessionProcessed.current || status !== 'authenticated' || !session?.user) {
      return;
    }
    
    
    if (session.user.gnr !== undefined && session.user.bnr !== undefined) {
      const propertyData: PropertyIdentifiers = {
        gnr: typeof session.user.gnr === 'number' ? session.user.gnr : 
             typeof session.user.gnr === 'string' ? parseInt(session.user.gnr, 10) : undefined,
        
        bnr: typeof session.user.bnr === 'number' ? session.user.bnr : 
             typeof session.user.bnr === 'string' ? parseInt(session.user.bnr, 10) : undefined,
        
        fnr: typeof session.user.fnr === 'number' ? session.user.fnr : 
             typeof session.user.fnr === 'string' ? parseInt(session.user.fnr, 10) : undefined,
        
        snr: typeof session.user.snr === 'number' ? session.user.snr : 
             typeof session.user.snr === 'string' ? parseInt(session.user.snr, 10) : undefined
      };
      
     
      console.log('User property data for map:', propertyData);
      setUserData(propertyData);
      
      
      const propertyNumber = formatPropertyNumber(
        propertyData.gnr,
        propertyData.bnr,
        propertyData.fnr,
        propertyData.snr
      );
      
      if (propertyNumber) {
        setSearchInput(propertyNumber);
      }
      
     
      sessionProcessed.current = true;
    } else {
      console.log('User is authenticated but has no property data');
    }
  }, [session, status]);

  return {
    userData,
    searchInput,
    setSearchInput,
    errorMessage,
    setErrorMessage,
    formatPropertyNumber,
    hasPropertyData: !!(userData?.gnr && userData?.bnr),
    searchProperty
  };
}
