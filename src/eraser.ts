function isIdentChar(ch: string): boolean {
  return (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || (ch >= "0" && ch <= "9") || ch === "_" || ch === "$"
}

function isWhitespace(ch: string): boolean {
  return ch === " " || ch === "\t" || ch === "\r" || ch === "\n"
}

function blankRange(chars: Array<string>, start: number, end: number, semiPrefix: boolean): void {
  for (let i = start; i < end; i++) {
    if (chars[i] === "\n") {
      continue
    }
    if (semiPrefix && i === start) {
      chars[i] = ";"
      semiPrefix = false
      continue
    }
    chars[i] = " "
  }
}

function matchWord(source: string, pos: number, word: string): boolean {
  if (source.length < pos + word.length) {
    return false
  }
  for (let i = 0; i < word.length; i++) {
    if (source[pos + i] !== word[i]) {
      return false
    }
  }
  if (pos + word.length < source.length && isIdentChar(source[pos + word.length])) {
    return false
  }
  return true
}

function skipWhitespace(source: string, pos: number): number {
  while (pos < source.length && isWhitespace(source[pos])) {
    pos++
  }
  return pos
}

function skipString(source: string, pos: number): number {
  const quote = source[pos]
  pos++
  while (pos < source.length) {
    if (source[pos] === "\\") {
      pos += 2
      continue
    }
    if (source[pos] === quote) {
      return pos + 1
    }
    pos++
  }
  return pos
}

function skipTemplateLiteral(source: string, pos: number): number {
  pos++
  while (pos < source.length) {
    if (source[pos] === "\\") {
      pos += 2
      continue
    }
    if (source[pos] === "`") {
      return pos + 1
    }
    if (source[pos] === "$" && pos + 1 < source.length && source[pos + 1] === "{") {
      pos += 2
      let depth = 1
      while (pos < source.length && depth > 0) {
        if (source[pos] === "{") {
          depth++
        } else if (source[pos] === "}") {
          depth--
        } else if (source[pos] === "'" || source[pos] === '"') {
          pos = skipString(source, pos)
          continue
        } else if (source[pos] === "`") {
          pos = skipTemplateLiteral(source, pos)
          continue
        } else if (source[pos] === "/" && pos + 1 < source.length && source[pos + 1] === "/") {
          pos = skipLineComment(source, pos)
          continue
        } else if (source[pos] === "/" && pos + 1 < source.length && source[pos + 1] === "*") {
          pos = skipBlockComment(source, pos)
          continue
        }
        pos++
      }
      continue
    }
    pos++
  }
  return pos
}

function skipLineComment(source: string, pos: number): number {
  while (pos < source.length && source[pos] !== "\n") {
    pos++
  }
  return pos
}

function skipBlockComment(source: string, pos: number): number {
  pos += 2
  while (pos < source.length) {
    if (source[pos] === "*" && pos + 1 < source.length && source[pos + 1] === "/") {
      return pos + 2
    }
    pos++
  }
  return pos
}

function skipOpaqueAt(source: string, pos: number): number {
  if (pos >= source.length) {
    return pos
  }
  const ch = source[pos]
  if (ch === "'" || ch === '"') {
    return skipString(source, pos)
  }
  if (ch === "`") {
    return skipTemplateLiteral(source, pos)
  }
  if (ch === "/" && pos + 1 < source.length) {
    if (source[pos + 1] === "/") {
      return skipLineComment(source, pos)
    }
    if (source[pos + 1] === "*") {
      return skipBlockComment(source, pos)
    }
  }
  return -1
}

function scanTypeExpression(source: string, pos: number, terminators: string): number {
  let depth = 0
  while (pos < source.length) {
    const opaque = skipOpaqueAt(source, pos)
    if (opaque !== -1) {
      pos = opaque
      continue
    }
    const ch = source[pos]
    if (depth === 0 && terminators.includes(ch)) {
      return pos
    }
    if (ch === "<" || ch === "(" || ch === "[" || ch === "{") {
      depth++
      pos++
      continue
    }
    if (ch === ">" || ch === ")" || ch === "]" || ch === "}") {
      depth--
      if (depth < 0) {
        return pos
      }
      pos++
      continue
    }
    pos++
  }
  return pos
}

function prevNonWhitespace(source: string, pos: number): string {
  let i = pos - 1
  while (i >= 0 && isWhitespace(source[i])) {
    i--
  }
  if (i < 0) {
    return ""
  }
  return source[i]
}

function prevWord(source: string, pos: number): string {
  let i = pos - 1
  while (i >= 0 && isWhitespace(source[i])) {
    i--
  }
  if (i < 0) {
    return ""
  }
  const end = i + 1
  while (i >= 0 && isIdentChar(source[i])) {
    i--
  }
  return source.slice(i + 1, end)
}

function nextNonWhitespace(source: string, pos: number): string {
  let i = pos
  while (i < source.length && isWhitespace(source[i])) {
    i++
  }
  if (i >= source.length) {
    return ""
  }
  return source[i]
}

function isAfterDot(source: string, pos: number): boolean {
  return prevNonWhitespace(source, pos) === "."
}

function findStatementEnd(source: string, pos: number): number {
  let depth = 0
  let sawBrace = false
  while (pos < source.length) {
    const opaque = skipOpaqueAt(source, pos)
    if (opaque !== -1) {
      pos = opaque
      continue
    }
    const ch = source[pos]
    if (ch === "{" || ch === "(" || ch === "[") {
      if (ch === "{") {
        sawBrace = true
      }
      depth++
      pos++
      continue
    }
    if (ch === "}" || ch === ")" || ch === "]") {
      if (depth === 0) {
        return pos + 1
      }
      depth--
      if (depth === 0 && ch === "}" && sawBrace) {
        return pos + 1
      }
      pos++
      continue
    }
    if (depth === 0 && ch === ";") {
      return pos + 1
    }
    if (depth === 0 && ch === "\n") {
      return pos
    }
    pos++
  }
  return pos
}

function scanImportStatement(source: string, pos: number): number {
  while (pos < source.length) {
    const opaque = skipOpaqueAt(source, pos)
    if (opaque !== -1) {
      pos = opaque
      continue
    }
    if (source[pos] === ";") {
      return pos + 1
    }
    if (source[pos] === "\n") {
      const next = skipWhitespace(source, pos + 1)
      if (next >= source.length || !isIdentChar(source[next]) && source[next] !== "'" && source[next] !== '"' && source[next] !== "{" && source[next] !== ",") {
        return pos
      }
    }
    pos++
  }
  return pos
}

function isTypeAnnotationContext(source: string, colonPos: number, parenDepth: number): boolean {
  const prev = prevNonWhitespace(source, colonPos)
  if (parenDepth > 0) {
    return prev === "?" || isIdentChar(prev) || prev === ")" || prev === "]" || prev === "}"
  }
  const word = prevWord(source, colonPos)
  if (word === "case" || word === "default") {
    return false
  }
  if (prev === "?" || prev === ")" || prev === "]") {
    return true
  }
  if (!isIdentChar(prev)) {
    return false
  }
  let i = colonPos - 1
  while (i >= 0 && isWhitespace(source[i])) {
    i--
  }
  const identEnd = i + 1
  while (i >= 0 && isIdentChar(source[i])) {
    i--
  }
  const beforeIdent = i >= 0 ? source[i] : ""
  if (beforeIdent === "." || beforeIdent === ":") {
    return false
  }

  let j = i
  while (j >= 0 && isWhitespace(source[j])) {
    j--
  }
  if (j >= 0) {
    const wordEnd = j + 1
    let k = j
    while (k >= 0 && isIdentChar(source[k])) {
      k--
    }
    const kw = source.slice(k + 1, wordEnd)
    if (kw === "const" || kw === "let" || kw === "var") {
      return true
    }
  }

  const identText = source.slice(i + 1, identEnd)
  if (identText === "const" || identText === "let" || identText === "var" || identText === "case" || identText === "default") {
    return false
  }

  return true
}

function getTypeAnnotationTerminators(source: string, colonPos: number, parenDepth: number): string {
  if (parenDepth > 0) {
    return ",)="
  }
  const prev = prevNonWhitespace(source, colonPos)
  if (prev === ")") {
    return "{;=>"
  }
  return ",;=\n"
}

function findReturnTypeEnd(source: string, pos: number): number {
  let p = pos
  while (p < source.length) {
    const opaque = skipOpaqueAt(source, p)
    if (opaque !== -1) {
      p = opaque
      continue
    }
    const ch = source[p]
    if (ch === "{") {
      return p
    }
    if (ch === "=" && p + 1 < source.length && source[p + 1] === ">") {
      return p
    }
    if (ch === ";" || ch === ")" || ch === "}") {
      return p
    }
    if (ch === "<" || ch === "(" || ch === "[") {
      p = scanTypeExpression(source, p + 1, "") + 0
      const closer: Record<string, string> = { "<": ">", "(": ")", "[": "]" }
      p = scanTypeExpression(source, p, closer[ch] || "")
      if (p < source.length) {
        p++
      }
      continue
    }
    p++
  }
  return p
}

export function eraseTypes(source: string): string {
  const chars = source.split("")
  const len = source.length
  let pos = 0
  let parenDepth = 0
  let braceDepth = 0

  while (pos < len) {
    const opaque = skipOpaqueAt(source, pos)
    if (opaque !== -1) {
      pos = opaque
      continue
    }

    const ch = source[pos]

    if (ch === "(") {
      parenDepth++
      pos++
      continue
    }
    if (ch === ")") {
      parenDepth--
      pos++
      continue
    }
    if (ch === "{") {
      braceDepth++
      pos++
      continue
    }
    if (ch === "}") {
      braceDepth--
      pos++
      continue
    }

    if (ch === ":" && isTypeAnnotationContext(source, pos, parenDepth)) {
      const terminators = getTypeAnnotationTerminators(source, pos, parenDepth)
      const start = pos
      pos++
      pos = skipWhitespace(source, pos)
      if (terminators.includes("{")) {
        const end = findReturnTypeEnd(source, pos)
        blankRange(chars, start, end, false)
        pos = end
      } else {
        const end = scanTypeExpression(source, pos, terminators)
        blankRange(chars, start, end, false)
        pos = end
      }
      continue
    }

    if (matchWord(source, pos, "interface") && !isAfterDot(source, pos)) {
      const start = pos
      pos += 9
      const end = findStatementEnd(source, pos)
      blankRange(chars, start, end, true)
      pos = end
      continue
    }

    if (matchWord(source, pos, "type") && !isAfterDot(source, pos)) {
      const start = pos
      pos += 4
      const afterType = skipWhitespace(source, pos)
      if (afterType < len && isIdentChar(source[afterType])) {
        let scan = afterType
        while (scan < len && isIdentChar(source[scan])) {
          scan++
        }
        const afterIdent = skipWhitespace(source, scan)
        if (afterIdent < len && (source[afterIdent] === "=" || source[afterIdent] === "<")) {
          const end = findStatementEnd(source, afterIdent)
          blankRange(chars, start, end, true)
          pos = end
          continue
        }
      }
      pos = start + 4
      continue
    }

    if (matchWord(source, pos, "import")) {
      const importStart = pos
      pos += 6
      const afterImport = skipWhitespace(source, pos)
      if (matchWord(source, afterImport, "type")) {
        const end = scanImportStatement(source, afterImport + 4)
        blankRange(chars, importStart, end, true)
        pos = end
        continue
      }
      pos = afterImport
      if (pos < len && source[pos] === "{") {
        pos++
        while (pos < len && source[pos] !== "}") {
          const opaque2 = skipOpaqueAt(source, pos)
          if (opaque2 !== -1) {
            pos = opaque2
            continue
          }
          if (matchWord(source, pos, "type")) {
            const typeStart = pos
            pos += 4
            const afterKw = skipWhitespace(source, pos)
            let identEnd = afterKw
            while (identEnd < len && isIdentChar(source[identEnd])) {
              identEnd++
            }
            if (identEnd > afterKw) {
              let eraseEnd = identEnd
              const afterIdent = skipWhitespace(source, identEnd)
              if (afterIdent < len && source[afterIdent] === ",") {
                eraseEnd = afterIdent + 1
              }
              if (eraseEnd === identEnd) {
                let lookBack = typeStart - 1
                while (lookBack >= 0 && isWhitespace(source[lookBack])) {
                  lookBack--
                }
                if (lookBack >= 0 && source[lookBack] === ",") {
                  blankRange(chars, lookBack, identEnd, false)
                  pos = identEnd
                  continue
                }
              }
              blankRange(chars, typeStart, eraseEnd, false)
              pos = eraseEnd
              continue
            }
          }
          pos++
        }
        if (pos < len) {
          pos++
        }
        const rest = scanImportStatement(source, pos)
        pos = rest
        continue
      }
      pos = scanImportStatement(source, importStart + 6)
      continue
    }

    if (matchWord(source, pos, "export")) {
      const exportStart = pos
      pos += 6
      const afterExport = skipWhitespace(source, pos)
      if (matchWord(source, afterExport, "type")) {
        const afterType = skipWhitespace(source, afterExport + 4)
        if (afterType < len && (source[afterType] === "{" || isIdentChar(source[afterType]))) {
          const peek = afterType
          if (source[peek] === "{") {
            const end = scanImportStatement(source, peek)
            blankRange(chars, exportStart, end, true)
            pos = end
            continue
          }
          let scan = peek
          while (scan < len && isIdentChar(source[scan])) {
            scan++
          }
          const afterIdent = skipWhitespace(source, scan)
          if (afterIdent < len && source[afterIdent] === "=") {
            const end = findStatementEnd(source, afterIdent)
            blankRange(chars, exportStart, end, true)
            pos = end
            continue
          }
        }
      }
      pos = afterExport
      continue
    }

    if (matchWord(source, pos, "declare") && !isAfterDot(source, pos)) {
      const start = pos
      const end = findStatementEnd(source, pos + 7)
      blankRange(chars, start, end, true)
      pos = end
      continue
    }

    if (matchWord(source, pos, "as") && !isAfterDot(source, pos)) {
      const prev = prevNonWhitespace(source, pos)
      if (isIdentChar(prev) || prev === ")" || prev === "]" || prev === '"' || prev === "'" || prev === "`") {
        const start = pos
        pos += 2
        pos = skipWhitespace(source, pos)
        const end = scanTypeExpression(source, pos, ",;)]\n}")
        blankRange(chars, start, end, false)
        pos = end
        continue
      }
    }

    if (matchWord(source, pos, "satisfies") && !isAfterDot(source, pos)) {
      const prev = prevNonWhitespace(source, pos)
      if (isIdentChar(prev) || prev === ")" || prev === "]" || prev === '"' || prev === "'" || prev === "`") {
        const start = pos
        pos += 9
        pos = skipWhitespace(source, pos)
        const end = scanTypeExpression(source, pos, ",;)]\n}")
        blankRange(chars, start, end, false)
        pos = end
        continue
      }
    }

    if (ch === "!" && pos > 0) {
      const prev = prevNonWhitespace(source, pos)
      if (isIdentChar(prev) || prev === ")" || prev === "]") {
        const next = pos + 1 < len ? source[pos + 1] : ""
        if (next === "." || next === "[") {
          chars[pos] = " "
          pos++
          continue
        }
      }
    }

    if (ch === "<" && pos > 0) {
      const prev = prevNonWhitespace(source, pos)
      if (isIdentChar(prev) || prev === ")") {
        const start = pos
        pos++
        let depth = 1
        let looksLikeGeneric = true
        while (pos < len && depth > 0) {
          const opaque2 = skipOpaqueAt(source, pos)
          if (opaque2 !== -1) {
            pos = opaque2
            continue
          }
          if (source[pos] === "<") {
            depth++
            pos++
            continue
          }
          if (source[pos] === ">") {
            depth--
            pos++
            continue
          }
          if (source[pos] === "(" || source[pos] === ")" || source[pos] === ";" || source[pos] === "{" || source[pos] === "}") {
            looksLikeGeneric = false
            break
          }
          pos++
        }
        if (looksLikeGeneric && depth === 0) {
          const afterClose = source[pos] === "(" || source[pos] === ")" || source[pos] === ">" || source[pos] === "," || source[pos] === ";" || source[pos] === "{" || source[pos] === "=" || source[pos] === "\n" || isWhitespace(source[pos]) || source[pos] === "[" || source[pos] === "." || source[pos] === "&" || source[pos] === "|" || pos >= len
          if (afterClose) {
            blankRange(chars, start, pos, false)
            continue
          }
        }
        pos = start + 1
        continue
      }
    }

    pos++
  }

  return chars.join("")
}
