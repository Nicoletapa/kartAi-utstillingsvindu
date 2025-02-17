import React from 'react'
import { ProgressBar } from '~/components/Progressbar'
import ProgressBarStep from '~/components/ProgressBarStep'

const App = () => {
  return (
    <div>
      <ProgressBar steps={[]} />
      <ProgressBarStep />
    </div>
  )
}

export default App
