"use client";

import { Bot, Check, Plus } from 'lucide-react';
import React from 'react';
import Link from 'next/link';

interface SectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const ActionLink: React.FC<{ 
    href: string; 
    icon: React.ReactNode;
    children: React.ReactNode 
  }> = ({ href, icon, children }) => (
    <Link href={href} className="flex items-center gap-2 hover:underline">
      {icon}
      {children}
    </Link>
  );

const Section: React.FC<SectionProps> = ({ title, children, className = '' }) => (
    <section className={`mb-8 ${className}`}>
      <h1 className='text-2xl font-medium mb-2'>{title}</h1>
      {children}
    </section>
  );
  
  const BulletList: React.FC<{ items: React.ReactNode[] }> = ({ items }) => (
    <ul className='list-disc ml-8 space-y-1 mb-4'>
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );

const KlarForASoke = () => {
  return (
    <div>
    <Section title="Klar for å starte?">
        <p>Du kan velge hvordan du vil komme i gang:</p>
        <BulletList items={[
          <ActionLink href="/atlas-app/sidebar/soknader" icon={<Plus size={20} />}>
            Start ny søknad
          </ActionLink>,
          <ActionLink href="/atlas-app/sidebar/sjekkliste" icon={<Check size={20} />}>
            Gå til sjekkliste
          </ActionLink>,
          <ActionLink href="/atlas-app/sidebar/min-oversikt" icon={<Bot size={20} />}>
            Start med chatbotten for veiledning
          </ActionLink>
        ]} />
      </Section>
    </div>
  )
}

export default KlarForASoke
