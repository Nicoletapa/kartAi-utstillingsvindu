/**
 * This file is used in Utstillingsvindu 2.0
 * 
 * @description
 * Currently renders hard-coded messages about updates on the user's building application.
 * 
 * @features
 * - Displays a list of messages with details
 * - Allows users to expand/collapse messages
 * - Marks messages as read when expanded
 * 
 * @props
 * - `messages` (Message[]): Array of messages to display.
 * - `onToggle` (function): Function to handle message toggle.
 * 
 * @note
 * - This component is designed to be used in a client-side context.
 * - The messages are currently hard-coded for demonstration purposes.
 * 
 * @usage
 * <Meldinger />
 */


"use client"

import React, { useState } from 'react'

interface MessageDetails {
  caseNumber: string
  caseOfficer: string
  department: string
  deadline?: string
  permitNumber?: string
}

interface Message {
  id: number
  title: string
  date: string
  application: string
  shortText: string
  fullText: string
  details: MessageDetails
  isRead: boolean
  isExpanded: boolean
}

const initialMessages: Message[] = [
  {
    id: 1,
    title: "Søknaden er godkjent",
    date: "05.04.2025 11:01",
    application: "SAK17 - Bruksendring",
    shortText: "Søknaden din godkjent.",
    fullText: "Søknaden din er godkjent av kommunen. Ikke glem å søke om ferdigattest når byggeprosessen er ferdig.",
    details: {
      caseNumber: "2025-12345",
      caseOfficer: "Per Olsen",
      department: "Byggesaksavdelingen"
    },
    isRead: false,
    isExpanded: false
  },
  {
    id: 2,
    title: "Dokument mangler",
    date: "03.04.2025 09:45",
    application: "SAK17 - Bruksendring",
    shortText: "Vi mangler tegninger for ditt prosjekt.",
    fullText: "Vi mangler tegninger for ditt prosjekt. Vennligst last opp følgende dokumenter: Situasjonsplan og plantegninger.",
    details: {
      caseNumber: "2025-12345",
      caseOfficer: "Per Olsen",
      department: "Byggesaksavdelingen",
      deadline: "15.04.2025"
    },
    isRead: true,
    isExpanded: false
  },
  {
    id: 3,
    title: "Søknad din er mottatt",
    date: "28.03.2025 14:30",
    application: "SAK17 - Bruksendring",
    shortText: "Søknaden din er mottatt og er nå under behandling.",
    fullText: "Søknaden din er mottatt og er nå under behandling. Vi vil kontakte deg hvis vi trenger ytterligere informasjon. Forventet behandlingstid er 6-8 uker.",
    details: {
      caseNumber: "2025-12345",
      caseOfficer: "Per Olsen",
      department: "Byggesaksavdelingen",
      permitNumber: "BYG-2025-4567"
    },
    isRead: true,
    isExpanded: false
  }
]

const MessageHeader = ({ 
  message,
  onToggle 
}: {
  message: Message
  onToggle: () => void
}) => (
  <div 
    className='flex justify-between items-start cursor-pointer'
    onClick={onToggle}
  >
    <div className='flex-1'>
      <div className='flex items-center'>
        <h2 className={`font-medium ${!message.isRead ? 'text-blue-800' : ''}`}>
          {message.title}
        </h2>
        {!message.isRead && (
          <span className='ml-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full'>
            Ny
          </span>
        )}
      </div>
      <p className='text-sm text-gray-500 mt-1'>{message.date}</p>
      <p className='mt-1'>{message.application}</p>
      <p className='mt-2'>{message.shortText}</p>
    </div>
    <button
      onClick={(e) => {
        e.stopPropagation()
        onToggle()
      }}
      className={`ml-4 text-sm font-medium px-4 py-2 rounded-md transition ${message.isExpanded ? 'bg-gray-200 hover:bg-gray-300' : 'bg-kartAI-blue text-white hover:bg-kartAI-lightblue'}`}
      aria-expanded={message.isExpanded}
      aria-controls={`message-content-${message.id}`}
    >
      {message.isExpanded ? 'Lukk' : 'Åpne'}
    </button>
  </div>
)

const MessageDetails = ({ details }: { details: MessageDetails }) => (
  <div className='mt-4 text-sm text-gray-600 space-y-2'>
    <p><strong>Saksnummer:</strong> {details.caseNumber}</p>
    <p><strong>Saksbehandler:</strong> {details.caseOfficer}</p>
    <p><strong>Avdeling:</strong> {details.department}</p>
    {details.deadline && (
      <p><strong>Frist:</strong> {details.deadline}</p>
    )}
    {details.permitNumber && (
      <p><strong>Tillatelsesnummer:</strong> {details.permitNumber}</p>
    )}
  </div>
)

const MessageContent = ({ 
  message,
  isExpanded 
}: {
  message: Message
  isExpanded: boolean
}) => (
  <div 
    id={`message-content-${message.id}`}
    className={`transition-all duration-300 overflow-hidden ${isExpanded ? 'max-h-screen mt-4' : 'max-h-0'}`}
    aria-hidden={!isExpanded}
  >
    <div className='pt-4 border-t mt-4'>
      <p>{message.fullText}</p>
      <MessageDetails details={message.details} />
    </div>
  </div>
)

const MessageItem = ({ 
  message,
  onToggle 
}: {
  message: Message
  onToggle: (id: number) => void
}) => {
  const handleToggle = () => onToggle(message.id)

  return (
    <div 
      className={`rounded-lg border p-4 transition-all duration-200 ${message.isRead ? 'bg-white' : 'bg-blue-50 border-blue-200'} ${message.isExpanded ? 'border-2 border-kartAI-blue' : 'border border-gray-200'}`}
    >
      <MessageHeader message={message} onToggle={handleToggle} />
      <MessageContent message={message} isExpanded={message.isExpanded} />
    </div>
  )
}

const Meldinger = () => {
  const [messages, setMessages] = useState<Message[]>(initialMessages)

  const toggleExpand = (id: number) => {
    setMessages(messages.map(msg => {
      if (msg.id === id) {
        return {
          ...msg,
          isExpanded: !msg.isExpanded,
          isRead: true
        }
      }
      return msg
    }))
  }

  return (
    <div className='p-4'>
      <h1 className='text-3xl pt-4 font-bold flex justify-center text-kartAI-blue mb-8'>
        Meldinger
      </h1>
      <p className="text-xl md:mx-20 px-6 mb-4 flex justify-center">
        Her finner du varsler, beskjeder og tilbakemeldinger fra kommunen.
      </p>

      <div className='md:mx-20 space-y-4'>
        {messages.map((message) => (
          <MessageItem 
            key={message.id} 
            message={message} 
            onToggle={toggleExpand} 
          />
        ))}
      </div>
    </div>
  )
}

export default Meldinger