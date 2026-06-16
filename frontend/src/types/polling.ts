export interface PollCreator {
  namaLengkap: string
}

export interface PollListItem {
  id: string
  pertanyaan: string
  deadline: string
  startsAt: string | null
  createdBy: PollCreator
  hasVoted: boolean
  isExpired: boolean
  totalVotes: number | null
}

export interface PollDetail {
  id: string
  pertanyaan: string
  opsi: string[]
  deadline: string
  startsAt: string | null
  createdBy: PollCreator
  createdAt: string
  hasVoted: boolean
  myVote: number | null
  isExpired: boolean
  results: Record<string, number> | null
  totalVotes: number | null
}

export interface PollListResponse {
  status: string
  data: PollListItem[]
}

export interface PollDetailResponse {
  status: string
  data: PollDetail
}
