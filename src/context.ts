import { createContext } from 'react'

export const ViewportContext = createContext<Window | null | undefined>(undefined)
