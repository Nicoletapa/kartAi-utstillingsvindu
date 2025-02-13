import React from 'react'
import { ProgressBar } from '~/components/Progressbar'
import StepperDemo from '~/components/ProgressBarStep'

const App = () => {
  return (
    <div>
      <ProgressBar steps={[]} />
      <StepperDemo />
    </div>
  )
}

export default App
