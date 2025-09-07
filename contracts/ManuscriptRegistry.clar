(define-constant ERR-DUPLICATE-HASH (err u100))
(define-constant ERR-INVALID-HASH (err u101))
(define-constant ERR-INVALID_TITLE (err u102))
(define-constant ERR-INVALID_ORIGIN (err u103))
(define-constant ERR-INVALID_AGE (err u104))
(define-constant ERR-INVALID_DESCRIPTION (err u105))
(define-constant ERR-INVALID_CATEGORY (err u106))
(define-constant ERR-INVALID_LANGUAGE (err u107))
(define-constant ERR_INVALID_SCRIPT (err u108))
(define-constant ERR_INVALID_CONDITION (err u109))
(define-constant ERR_INVALID_PROVENANCE (err u110))
(define-constant ERR_MANUSCRIPT_NOT_FOUND (err u111))
(define-constant ERR_NOT_AUTHORIZED (err u112))
(define-constant ERR_MAX_MANUSCRIPTS_EXCEEDED (err u113))
(define-constant ERR_INVALID_UPDATE_HASH (err u114))
(define-constant ERR_UPDATE_NOT_ALLOWED (err u115))
(define-constant ERR_INVALID_TIMESTAMP (err u116))
(define-constant ERR_AUTHORITY_NOT_VERIFIED (err u117))
(define-constant ERR_INVALID_METADATA (err u118))
(define-constant ERR_INVALID_ACCESS_LEVEL (err u119))
(define-constant ERR_INVALID_LICENSE (err u120))

(define-data-var next-manuscript-id uint u0)
(define-data-var max-manuscripts uint u10000)
(define-data-var registration-fee uint u500)
(define-data-var authority-contract (optional principal) none)

(define-map Manuscripts
  uint
  {
    hash: (buff 32),
    owner: principal,
    title: (string-ascii 100),
    origin: (string-ascii 100),
    age: uint,
    description: (string-ascii 500),
    category: (string-ascii 50),
    language: (string-ascii 50),
    script: (string-ascii 50),
    condition: (string-ascii 50),
    provenance: (string-ascii 200),
    registered-at: uint,
    access-level: uint,
    license: (string-ascii 100)
  }
)

(define-map ManuscriptsByHash
  (buff 32)
  uint
)

(define-map ManuscriptUpdates
  uint
  {
    update-hash: (buff 32),
    update-title: (string-ascii 100),
    update-description: (string-ascii 500),
    update-age: uint,
    update-timestamp: uint,
    updater: principal
  }
)

(define-read-only (get-manuscript (id uint))
  (map-get? Manuscripts id)
)

(define-read-only (get-manuscript-updates (id uint))
  (map-get? ManuscriptUpdates id)
)

(define-read-only (is-manuscript-registered (h (buff 32)))
  (is-some (map-get? ManuscriptsByHash h))
)

(define-read-only (get-manuscript-count)
  (ok (var-get next-manuscript-id))
)

(define-private (validate-hash (h (buff 32)))
  (if (is-eq (len h) u32)
      (ok true)
      ERR-INVALID-HASH)
)

(define-private (validate-title (t (string-ascii 100)))
  (if (> (len t) u0)
      (ok true)
      ERR-INVALID_TITLE)
)

(define-private (validate-origin (o (string-ascii 100)))
  (if (> (len o) u0)
      (ok true)
      ERR-INVALID_ORIGIN)
)

(define-private (validate-age (a uint))
  (if (and (> a u0) (<= a u10000))
      (ok true)
      ERR-INVALID_AGE)
)

(define-private (validate-description (d (string-ascii 500)))
  (if (> (len d) u0)
      (ok true)
      ERR-INVALID_DESCRIPTION)
)

(define-private (validate-category (c (string-ascii 50)))
  (if (or (is-eq c "historical") (is-eq c "religious") (is-eq c "scientific") (is-eq c "literary"))
      (ok true)
      ERR-INVALID_CATEGORY)
)

(define-private (validate-language (l (string-ascii 50)))
  (if (> (len l) u0)
      (ok true)
      ERR-INVALID_LANGUAGE)
)

(define-private (validate-script (s (string-ascii 50)))
  (if (> (len s) u0)
      (ok true)
      ERR_INVALID_SCRIPT)
)

(define-private (validate-condition (cond (string-ascii 50)))
  (if (or (is-eq cond "excellent") (is-eq cond "good") (is-eq cond "fair") (is-eq cond "poor"))
      (ok true)
      ERR_INVALID_CONDITION)
)

(define-private (validate-provenance (p (string-ascii 200)))
  (if (> (len p) u0)
      (ok true)
      ERR_INVALID_PROVENANCE)
)

(define-private (validate-access-level (al uint))
  (if (and (>= al u0) (<= al u3))
      (ok true)
      ERR_INVALID_ACCESS_LEVEL)
)

(define-private (validate-license (lic (string-ascii 100)))
  (if (> (len lic) u0)
      (ok true)
      ERR_INVALID_LICENSE)
)

(define-private (validate-timestamp (ts uint))
  (if (>= ts block-height)
      (ok true)
      ERR_INVALID_TIMESTAMP)
)

(define-public (set-authority-contract (contract-principal principal))
  (begin
    (asserts! (is-none (var-get authority-contract)) ERR_AUTHORITY_NOT_VERIFIED)
    (var-set authority-contract (some contract-principal))
    (ok true))
)

(define-public (set-max-manuscripts (new-max uint))
  (begin
    (asserts! (is-some (var-get authority-contract)) ERR_AUTHORITY_NOT_VERIFIED)
    (var-set max-manuscripts new-max)
    (ok true))
)

(define-public (set-registration-fee (new-fee uint))
  (begin
    (asserts! (is-some (var-get authority-contract)) ERR_AUTHORITY_NOT_VERIFIED)
    (var-set registration-fee new-fee)
    (ok true))
)

(define-public (register-manuscript
  (hash (buff 32))
  (title (string-ascii 100))
  (origin (string-ascii 100))
  (age uint)
  (description (string-ascii 500))
  (category (string-ascii 50))
  (language (string-ascii 50))
  (script (string-ascii 50))
  (condition (string-ascii 50))
  (provenance (string-ascii 200))
  (access-level uint)
  (license (string-ascii 100)))
  (let (
        (next-id (var-get next-manuscript-id))
        (current-max (var-get max-manuscripts))
        (authority-check (contract-call? .authority-management is-verified-authority tx-sender))
        (caller tx-sender)
        (timestamp block-height)
      )
    (asserts! (< next-id current-max) ERR_MAX_MANUSCRIPTS_EXCEEDED)
    (try! (validate-hash hash))
    (try! (validate-title title))
    (try! (validate-origin origin))
    (try! (validate-age age))
    (try! (validate-description description))
    (try! (validate-category category))
    (try! (validate-language language))
    (try! (validate-script script))
    (try! (validate-condition condition))
    (try! (validate-provenance provenance))
    (try! (validate-access-level access-level))
    (try! (validate-license license))
    (asserts! (is-ok authority-check) ERR_NOT_AUTHORIZED)
    (asserts! (is-none (map-get? ManuscriptsByHash hash)) ERR_DUPLICATE_HASH)
    (map-set Manuscripts next-id
      {
        hash: hash,
        owner: caller,
        title: title,
        origin: origin,
        age: age,
        description: description,
        category: category,
        language: language,
        script: script,
        condition: condition,
        provenance: provenance,
        registered-at: timestamp,
        access-level: access-level,
        license: license
      }
    )
    (map-set ManuscriptsByHash hash next-id)
    (var-set next-manuscript-id (+ next-id u1))
    (print { event: "manuscript-registered", id: next-id })
    (ok next-id))
)

(define-public (update-manuscript
  (id uint)
  (new-hash (buff 32))
  (new-title (string-ascii 100))
  (new-description (string-ascii 500))
  (new-age uint))
  (let (
        (manuscript (map-get? Manuscripts id))
        (authority-check (contract-call? .authority-management is-verified-authority tx-sender))
        (caller tx-sender)
        (timestamp block-height)
      )
    (match manuscript
      m
        (begin
          (asserts! (is-eq (get owner m) caller) ERR_NOT_AUTHORIZED)
          (try! (validate-hash new-hash))
          (try! (validate-title new-title))
          (try! (validate-description new-description))
          (try! (validate-age new-age))
          (asserts! (is-ok authority-check) ERR_NOT_AUTHORIZED)
          (let ((existing (map-get? ManuscriptsByHash new-hash)))
            (asserts!
              (or (is-none existing)
                  (is-eq (default-to uffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff existing) id))
              ERR_DUPLICATE_HASH))
          (let ((old-hash (get hash m)))
            (map-delete ManuscriptsByHash old-hash)
            (map-set ManuscriptsByHash new-hash id))
          (map-set Manuscripts id
            {
              hash: new-hash,
              owner: (get owner m),
              title: new-title,
              origin: (get origin m),
              age: new-age,
              description: new-description,
              category: (get category m),
              language: (get language m),
              script: (get script m),
              condition: (get condition m),
              provenance: (get provenance m),
              registered-at: (get registered-at m),
              access-level: (get access-level m),
              license: (get license m)
            }
          )
          (map-set ManuscriptUpdates id
            {
              update-hash: new-hash,
              update-title: new-title,
              update-description: new-description,
              update-age: new-age,
              update-timestamp: timestamp,
              updater: caller
            }
          )
          (print { event: "manuscript-updated", id: id })
          (ok true))
      ERR_MANUSCRIPT_NOT_FOUND))
)

(define-public (transfer-ownership (id uint) (new-owner principal))
  (let (
        (manuscript (map-get? Manuscripts id))
        (caller tx-sender)
      )
    (match manuscript
      m
        (begin
          (asserts! (is-eq (get owner m) caller) ERR_NOT_AUTHORIZED)
          (map-set Manuscripts id
            (merge m { owner: new-owner })
          )
          (print { event: "ownership-transferred", id: id, new-owner: new-owner })
          (ok true))
      ERR_MANUSCRIPT_NOT_FOUND))
)

(define-public (set-access-level (id uint) (new-level uint))
  (let (
        (manuscript (map-get? Manuscripts id))
        (caller tx-sender)
      )
    (match manuscript
      m
        (begin
          (asserts! (is-eq (get owner m) caller) ERR_NOT_AUTHORIZED)
          (try! (validate-access-level new-level))
          (map-set Manuscripts id
            (merge m { access-level: new-level })
          )
          (print { event: "access-level-updated", id: id, new-level: new-level })
          (ok true))
      ERR_MANUSCRIPT_NOT_FOUND))
)