import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import type {
  ViewerContent,
} from '../provider/ViewerProvider'

export type ContentRendererProps = {
  content: ViewerContent

  title?: string
  className?: string

  /*
   * Optional sandbox policy for URL content.
   *
   * The neutral renderer does not assume application-specific
   * permissions. Hosts may explicitly provide the policy they need.
   */
  sandbox?: string
}

function UrlContent({
  url,
  title,
  className,
  sandbox,
}: {
  url: string
  title?: string
  className?: string
  sandbox?: string
}) {
  return (
    <iframe
      src={url}
      title={title ?? 'on-chain content'}
      className={className}
      sandbox={sandbox}
      scrolling="no"
      style={{
        width: '100%',
        height: '100%',
        border: 0,
        display: 'block',
        background: 'transparent',
      }}
    />
  )
}

function TextContent({
  text,
  className,
}: {
  text: string
  className?: string
}) {
  return (
    <pre
      className={className}
      style={{
        margin: 0,
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        overflow: 'auto',
        whiteSpace: 'pre-wrap',
        overflowWrap: 'anywhere',
      }}
    >
      {text}
    </pre>
  )
}

function BytesContent({
  bytes,
  contentType,
  title,
  className,
  sandbox,
}: {
  bytes: ArrayBuffer
  contentType?: string | null
  title?: string
  className?: string
  sandbox?: string
}) {
  const [url, setUrl] =
    useState<string | null>(null)

  useEffect(() => {
    const blob =
      new Blob(
        [bytes],
        {
          type:
            contentType ??
            'application/octet-stream',
        },
      )

    const nextUrl =
      URL.createObjectURL(blob)

    setUrl(nextUrl)

    return () => {
      URL.revokeObjectURL(nextUrl)
    }
  }, [bytes, contentType])

  if (!url) {
    return null
  }

  return (
    <UrlContent
      url={url}
      title={title}
      className={className}
      sandbox={sandbox}
    />
  )
}

export function ContentRenderer({
  content,
  title,
  className,
  sandbox,
}: ContentRendererProps) {
  const normalizedTitle =
    useMemo(
      () =>
        title?.trim() ||
        'on-chain content',
      [title],
    )

  switch (content.kind) {
    case 'url':
      return (
        <UrlContent
          url={content.url}
          title={normalizedTitle}
          className={className}
          sandbox={sandbox}
        />
      )

    case 'text':
      return (
        <TextContent
          text={content.text}
          className={className}
        />
      )

    case 'bytes':
      return (
        <BytesContent
          bytes={content.bytes}
          contentType={content.contentType}
          title={normalizedTitle}
          className={className}
          sandbox={sandbox}
        />
      )
  }
}
