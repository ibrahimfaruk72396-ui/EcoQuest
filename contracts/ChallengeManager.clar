(define-constant ERR-NOT-AUTHORIZED u100)
(define-constant ERR-INVALID-CHALLENGE-NAME u101)
(define-constant ERR-INVALID-DESCRIPTION u102)
(define-constant ERR-INVALID-DURATION u103)
(define-constant ERR-INVALID-REWARD u104)
(define-constant ERR-INVALID-REQUIRED-ACTIONS u105)
(define-constant ERR-CHALLENGE-ALREADY-EXISTS u106)
(define-constant ERR-CHALLENGE-NOT-FOUND u107)
(define-constant ERR-INVALID-START-TIME u108)
(define-constant ERR-AUTHORITY-NOT-VERIFIED u109)
(define-constant ERR-INVALID-MIN-PARTICIPANTS u110)
(define-constant ERR-INVALID-MAX-PARTICIPANTS u111)
(define-constant ERR-CHALLENGE-UPDATE-NOT-ALLOWED u112)
(define-constant ERR-INVALID-UPDATE-PARAM u113)
(define-constant ERR-MAX-CHALLENGES-EXCEEDED u114)
(define-constant ERR-INVALID-CHALLENGE-TYPE u115)
(define-constant ERR-INVALID-DIFFICULTY u116)
(define-constant ERR-INVALID-GRACE-PERIOD u117)
(define-constant ERR-INVALID-LOCATION u118)
(define-constant ERR-INVALID-CATEGORY u119)
(define-constant ERR-INVALID-STATUS u120)
(define-constant ERR-ALREADY-JOINED u121)
(define-constant ERR-NOT-JOINED u122)
(define-constant ERR-CHALLENGE_ENDED u123)
(define-constant ERR-CHALLENGE_NOT_STARTED u124)
(define-constant ERR-INVALID-PROGRESS u125)
(define-constant ERR-REWARD-ALREADY-CLAIMED u126)

(define-data-var next-challenge-id uint u0)
(define-data-var max-challenges uint u1000)
(define-data-var creation-fee uint u1000)
(define-data-var authority-contract (optional principal) none)

(define-map challenges
  uint
  {
    name: (string-utf8 100),
    description: (string-utf8 500),
    start-time: uint,
    duration: uint,
    reward-amount: uint,
    required-actions: uint,
    min-participants: uint,
    max-participants: uint,
    creator: principal,
    challenge-type: (string-utf8 50),
    difficulty: uint,
    grace-period: uint,
    location: (string-utf8 100),
    category: (string-utf8 50),
    status: bool
  }
)

(define-map challenges-by-name
  (string-utf8 100)
  uint)

(define-map challenge-updates
  uint
  {
    update-name: (string-utf8 100),
    update-description: (string-utf8 500),
    update-duration: uint,
    update-timestamp: uint,
    updater: principal
  }
)

(define-map challenge-participants
  { challenge-id: uint, user: principal }
  {
    joined: bool,
    progress: uint,
    completed: bool,
    reward-claimed: bool
  }
)

(define-read-only (get-challenge (id uint))
  (map-get? challenges id)
)

(define-read-only (get-challenge-updates (id uint))
  (map-get? challenge-updates id)
)

(define-read-only (is-challenge-registered (name (string-utf8 100)))
  (is-some (map-get? challenges-by-name name))
)

(define-read-only (get-participant-status (challenge-id uint) (user principal))
  (map-get? challenge-participants { challenge-id: challenge-id, user: user })
)

(define-private (validate-name (name (string-utf8 100)))
  (if (and (> (len name) u0) (<= (len name) u100))
      (ok true)
      (err ERR-INVALID-CHALLENGE-NAME))
)

(define-private (validate-description (desc (string-utf8 500)))
  (if (and (> (len desc) u0) (<= (len desc) u500))
      (ok true)
      (err ERR-INVALID-DESCRIPTION))
)

(define-private (validate-duration (dur uint))
  (if (> dur u0)
      (ok true)
      (err ERR-INVALID-DURATION))
)

(define-private (validate-reward (rew uint))
  (if (> rew u0)
      (ok true)
      (err ERR-INVALID-REWARD))
)

(define-private (validate-required-actions (actions uint))
  (if (> actions u0)
      (ok true)
      (err ERR-INVALID-REQUIRED-ACTIONS))
)

(define-private (validate-start-time (start uint))
  (if (>= start block-height)
      (ok true)
      (err ERR-INVALID-START-TIME))
)

(define-private (validate-min-participants (min uint))
  (if (> min u0)
      (ok true)
      (err ERR-INVALID-MIN-PARTICIPANTS))
)

(define-private (validate-max-participants (max uint))
  (if (> max u0)
      (ok true)
      (err ERR-INVALID-MAX-PARTICIPANTS))
)

(define-private (validate-challenge-type (typ (string-utf8 50)))
  (if (or (is-eq typ "recycling") (is-eq typ "energy-saving") (is-eq typ "transport"))
      (ok true)
      (err ERR-INVALID-CHALLENGE-TYPE))
)

(define-private (validate-difficulty (diff uint))
  (if (and (>= diff u1) (<= diff u10))
      (ok true)
      (err ERR-INVALID-DIFFICULTY))
)

(define-private (validate-grace-period (period uint))
  (if (<= period u30)
      (ok true)
      (err ERR-INVALID-GRACE-PERIOD))
)

(define-private (validate-location (loc (string-utf8 100)))
  (if (and (> (len loc) u0) (<= (len loc) u100))
      (ok true)
      (err ERR-INVALID-LOCATION))
)

(define-private (validate-category (cat (string-utf8 50)))
  (if (or (is-eq cat "daily") (is-eq cat "weekly") (is-eq cat "monthly"))
      (ok true)
      (err ERR-INVALID-CATEGORY))
)

(define-private (validate-principal (p principal))
  (if (not (is-eq p 'SP000000000000000000002Q6VF78))
      (ok true)
      (err ERR-NOT-AUTHORIZED))
)

(define-public (set-authority-contract (contract-principal principal))
  (begin
    (try! (validate-principal contract-principal))
    (asserts! (is-none (var-get authority-contract)) (err ERR-AUTHORITY-NOT-VERIFIED))
    (var-set authority-contract (some contract-principal))
    (ok true)
  )
)

(define-public (set-max-challenges (new-max uint))
  (begin
    (asserts! (> new-max u0) (err ERR-INVALID-UPDATE-PARAM))
    (asserts! (is-some (var-get authority-contract)) (err ERR-AUTHORITY-NOT-VERIFIED))
    (var-set max-challenges new-max)
    (ok true)
  )
)

(define-public (set-creation-fee (new-fee uint))
  (begin
    (asserts! (>= new-fee u0) (err ERR-INVALID-UPDATE-PARAM))
    (asserts! (is-some (var-get authority-contract)) (err ERR-AUTHORITY-NOT-VERIFIED))
    (var-set creation-fee new-fee)
    (ok true)
  )
)

(define-public (create-challenge
  (challenge-name (string-utf8 100))
  (description (string-utf8 500))
  (start-time uint)
  (duration uint)
  (reward-amount uint)
  (required-actions uint)
  (min-participants uint)
  (max-participants uint)
  (challenge-type (string-utf8 50))
  (difficulty uint)
  (grace-period uint)
  (location (string-utf8 100))
  (category (string-utf8 50))
)
  (let (
        (next-id (var-get next-challenge-id))
        (current-max (var-get max-challenges))
        (authority (var-get authority-contract))
      )
    (asserts! (< next-id current-max) (err ERR-MAX-CHALLENGES-EXCEEDED))
    (try! (validate-name challenge-name))
    (try! (validate-description description))
    (try! (validate-start-time start-time))
    (try! (validate-duration duration))
    (try! (validate-reward reward-amount))
    (try! (validate-required-actions required-actions))
    (try! (validate-min-participants min-participants))
    (try! (validate-max-participants max-participants))
    (try! (validate-challenge-type challenge-type))
    (try! (validate-difficulty difficulty))
    (try! (validate-grace-period grace-period))
    (try! (validate-location location))
    (try! (validate-category category))
    (asserts! (is-none (map-get? challenges-by-name challenge-name)) (err ERR-CHALLENGE-ALREADY-EXISTS))
    (let ((authority-recipient (unwrap! authority (err ERR-AUTHORITY-NOT-VERIFIED))))
      (try! (stx-transfer? (var-get creation-fee) tx-sender authority-recipient))
    )
    (map-set challenges next-id
      {
        name: challenge-name,
        description: description,
        start-time: start-time,
        duration: duration,
        reward-amount: reward-amount,
        required-actions: required-actions,
        min-participants: min-participants,
        max-participants: max-participants,
        creator: tx-sender,
        challenge-type: challenge-type,
        difficulty: difficulty,
        grace-period: grace-period,
        location: location,
        category: category,
        status: true
      }
    )
    (map-set challenges-by-name challenge-name next-id)
    (var-set next-challenge-id (+ next-id u1))
    (print { event: "challenge-created", id: next-id })
    (ok next-id)
  )
)

(define-public (update-challenge
  (challenge-id uint)
  (update-name (string-utf8 100))
  (update-description (string-utf8 500))
  (update-duration uint)
)
  (let ((challenge (map-get? challenges challenge-id)))
    (match challenge
      ch
        (begin
          (asserts! (is-eq (get creator ch) tx-sender) (err ERR-NOT-AUTHORIZED))
          (try! (validate-name update-name))
          (try! (validate-description update-description))
          (try! (validate-duration update-duration))
          (let ((existing (map-get? challenges-by-name update-name)))
            (match existing
              existing-id
                (asserts! (is-eq existing-id challenge-id) (err ERR-CHALLENGE-ALREADY-EXISTS))
              (begin true)
            )
          )
          (let ((old-name (get name ch)))
            (if (is-eq old-name update-name)
                (ok true)
                (begin
                  (map-delete challenges-by-name old-name)
                  (map-set challenges-by-name update-name challenge-id)
                  (ok true)
                )
            )
          )
          (map-set challenges challenge-id
            {
              name: update-name,
              description: update-description,
              start-time: (get start-time ch),
              duration: update-duration,
              reward-amount: (get reward-amount ch),
              required-actions: (get required-actions ch),
              min-participants: (get min-participants ch),
              max-participants: (get max-participants ch),
              creator: (get creator ch),
              challenge-type: (get challenge-type ch),
              difficulty: (get difficulty ch),
              grace-period: (get grace-period ch),
              location: (get location ch),
              category: (get category ch),
              status: (get status ch)
            }
          )
          (map-set challenge-updates challenge-id
            {
              update-name: update-name,
              update-description: update-description,
              update-duration: update-duration,
              update-timestamp: block-height,
              updater: tx-sender
            }
          )
          (print { event: "challenge-updated", id: challenge-id })
          (ok true)
        )
      (err ERR-CHALLENGE-NOT-FOUND)
    )
  )
)

(define-public (join-challenge (challenge-id uint))
  (let ((challenge (unwrap! (map-get? challenges challenge-id) (err ERR-CHALLENGE-NOT-FOUND))))
    (asserts! (>= block-height (get start-time challenge)) (err ERR-CHALLENGE_NOT_STARTED))
    (asserts! (< block-height (+ (get start-time challenge) (get duration challenge))) (err ERR-CHALLENGE_ENDED))
    (asserts! (not (default-to false (get joined (map-get? challenge-participants { challenge-id: challenge-id, user: tx-sender })))) (err ERR-ALREADY-JOINED))
    (map-set challenge-participants { challenge-id: challenge-id, user: tx-sender }
      {
        joined: true,
        progress: u0,
        completed: false,
        reward-claimed: false
      }
    )
    (print { event: "joined-challenge", id: challenge-id, user: tx-sender })
    (ok true)
  )
)

(define-public (update-progress (challenge-id uint) (action-count uint))
  (let (
        (challenge (unwrap! (map-get? challenges challenge-id) (err ERR-CHALLENGE-NOT-FOUND)))
        (participant (unwrap! (map-get? challenge-participants { challenge-id: challenge-id, user: tx-sender }) (err ERR-NOT-JOINED)))
      )
    (asserts! (get joined participant) (err ERR-NOT-JOINED))
    (asserts! (< block-height (+ (get start-time challenge) (get duration challenge))) (err ERR-CHALLENGE_ENDED))
    (let ((new-progress (+ (get progress participant) action-count)))
      (asserts! (<= new-progress (get required-actions challenge)) (err ERR-INVALID-PROGRESS))
      (map-set challenge-participants { challenge-id: challenge-id, user: tx-sender }
        (merge participant { progress: new-progress, completed: (>= new-progress (get required-actions challenge)) })
      )
      (print { event: "progress-updated", id: challenge-id, user: tx-sender, progress: new-progress })
      (ok new-progress)
    )
  )
)

(define-public (claim-reward (challenge-id uint))
  (let (
        (challenge (unwrap! (map-get? challenges challenge-id) (err ERR-CHALLENGE-NOT-FOUND)))
        (participant (unwrap! (map-get? challenge-participants { challenge-id: challenge-id, user: tx-sender }) (err ERR-NOT-JOINED)))
      )
    (asserts! (get completed participant) (err ERR-NOT-JOINED))
    (asserts! (not (get reward-claimed participant)) (err ERR-REWARD-ALREADY-CLAIMED))
    (asserts! (>= block-height (+ (get start-time challenge) (get duration challenge))) (err ERR-CHALLENGE_ENDED))
    (map-set challenge-participants { challenge-id: challenge-id, user: tx-sender }
      (merge participant { reward-claimed: true })
    )
    (print { event: "reward-claimed", id: challenge-id, user: tx-sender, amount: (get reward-amount challenge) })
    (ok (get reward-amount challenge))
  )
)

(define-public (get-challenge-count)
  (ok (var-get next-challenge-id))
)

(define-public (check-challenge-existence (name (string-utf8 100)))
  (ok (is-challenge-registered name))
)