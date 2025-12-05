import * as React from 'react'
import * as ReactDOM from 'react-dom'

// React 18+ root type
interface Root {
  render(children: React.ReactNode): void
  unmount(): void
}

export type HasLegacyRender = (typeof ReactDOM) extends { render(...args: any[]): any } ? true : false

export type CreateRoot = (container: Element | DocumentFragment) => Root

type ReactDOMRenderer = (
  element: React.ReactElement,
  container: HTMLElement
) => React.Component | Element

export type Renderer = { mount: ReactDOMRenderer, unmount: (container: HTMLElement) => void }

export function getRenderer(props?: { createRoot?: CreateRoot }): Renderer {
  const createRoot = props?.createRoot
  const wrappers = new WeakMap<HTMLElement, HTMLElement>()

  function getWrapper(container: HTMLElement) {
    const wrapper = wrappers.get(container)

    if (wrapper) return wrapper

    const span = document.createElement('span')

    container.appendChild(span)
    wrappers.set(container, span)
    return span
  }

  function removeWrapper(container: HTMLElement): void {
    const wrapper = wrappers.get(container)

    if (wrapper) {
      wrapper.remove()
      wrappers.delete(container)
    }
  }

  // React 18+ path with createRoot
  if (createRoot) {
    const roots = new WeakMap<HTMLElement, Root>()

    return {
      mount: (element: React.ReactElement, container: HTMLElement) => {
        const wrapper = getWrapper(container)

        let root = roots.get(wrapper)

        if (!root) {
          root = createRoot(wrapper)
          roots.set(wrapper, root)
        }

        root.render(element)
        return wrapper.firstElementChild ?? wrapper
      },
      unmount: (container: HTMLElement) => {
        const wrapper = getWrapper(container)
        const root = roots.get(wrapper)

        if (root) {
          root.unmount()
          roots.delete(wrapper)
        }
        removeWrapper(container)
      }
    }
  }
  throw new Error('Only react 18+ is supported');
}
