import * as React from "react"
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

type SortDirection = "asc" | "desc"
type GridElement = React.ReactElement<React.HTMLAttributes<HTMLElement> & { colSpan?: number }>

const flattenChildren = (children: React.ReactNode): React.ReactNode[] =>
  React.Children.toArray(children).flatMap((child) =>
    React.isValidElement(child) && child.type === React.Fragment
      ? flattenChildren(child.props.children)
      : [child]
  )

const getTextContent = (node: React.ReactNode): string => {
  if (node == null || typeof node === "boolean") return ""
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(getTextContent).join(" ")
  if (React.isValidElement(node)) return getTextContent(node.props.children)
  return ""
}

const getCells = (row: GridElement): GridElement[] =>
  flattenChildren(row.props.children).filter(
    (child): child is GridElement =>
      React.isValidElement(child) && (child.type === TableHead || child.type === TableCell)
  )

const containsButton = (node: React.ReactNode): boolean =>
  flattenChildren(node).some((child) =>
    React.isValidElement(child) &&
    (child.type === "button" || typeof child.props.onClick === "function" || containsButton(child.props.children))
  )

const compareCellValues = (left: string, right: string): number => {
  const leftText = left.trim()
  const rightText = right.trim()
  const numberPattern = /^[-+]?\d+(?:\.\d+)?$/
  const normalizedLeft = leftText.replace(/[₹$€£,%\s]/g, "").replace(/,/g, "")
  const normalizedRight = rightText.replace(/[₹$€£,%\s]/g, "").replace(/,/g, "")

  if (numberPattern.test(normalizedLeft) && numberPattern.test(normalizedRight)) {
    return Number(normalizedLeft) - Number(normalizedRight)
  }

  const leftDate = Date.parse(leftText)
  const rightDate = Date.parse(rightText)
  const dateLike = /(?:\d{1,4}[-/]\d{1,2}[-/]\d{1,4}|\d{1,2}\s+[A-Za-z]{3,}\s+\d{4}|[A-Za-z]{3,}\s+\d{1,2},?\s+\d{4})/
  if (dateLike.test(leftText) && dateLike.test(rightText) && !Number.isNaN(leftDate) && !Number.isNaN(rightDate)) {
    return leftDate - rightDate
  }

  return leftText.localeCompare(rightText, undefined, { numeric: true, sensitivity: "base" })
}

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, children, ...props }, ref) => {
  const [sortColumn, setSortColumn] = React.useState<number | null>(null)
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("asc")
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(20)
  const pageSizeId = React.useId()
  const tableChildren = React.useMemo(() => flattenChildren(children), [children])
  const tableHeader = tableChildren.find(
    (child): child is GridElement => React.isValidElement(child) && child.type === TableHeader
  )
  const tableBody = tableChildren.find(
    (child): child is GridElement => React.isValidElement(child) && child.type === TableBody
  )
  const headerRows = tableHeader ? flattenChildren(tableHeader.props.children).filter(
    (child): child is GridElement => React.isValidElement(child) && child.type === TableRow
  ) : []
  const headerCells = headerRows.length ? getCells(headerRows[0]) : []
  const bodyRows = React.useMemo(
    () => tableBody ? flattenChildren(tableBody.props.children).filter(
      (child): child is GridElement => React.isValidElement(child) && child.type === TableRow
    ) : [],
    [tableBody]
  )
  const rowSignature = React.useMemo(
    () => bodyRows.map((row, index) => `${row.key ?? index}:${getTextContent(row.props.children)}`).join("\u001f"),
    [bodyRows]
  )
  const firstRowCells = bodyRows.length === 1 ? getCells(bodyRows[0]) : []
  const hasEmptyState = firstRowCells.length === 1 &&
    Boolean(firstRowCells[0].props.colSpan && firstRowCells[0].props.colSpan > 1)

  React.useEffect(() => {
    setPage(1)
  }, [rowSignature])

  const actionColumnIndex = headerCells.findIndex((cell, index) => {
    const headerText = getTextContent(cell.props.children).trim().toLowerCase()
    if (/^(actions?|details?|operations?|manage|view)$/.test(headerText)) return true
    return headerText.length === 0 &&
      index === headerCells.length - 1 &&
      bodyRows.some((row) => containsButton(getCells(row)[index]?.props.children))
  })

  const sortedRows = React.useMemo(() => {
    if (sortColumn === null || actionColumnIndex === sortColumn) return bodyRows
    const dataRows = bodyRows.filter((row) => getCells(row).every((cell) => !cell.props.colSpan))
    const summaryRows = bodyRows.filter((row) => getCells(row).some((cell) => cell.props.colSpan))
    const sortValues = dataRows.map((row, originalIndex) => ({
      row,
      originalIndex,
      value: getTextContent(getCells(row)[sortColumn]?.props.children),
    }))
    return [
      ...sortValues
        .sort(({ value: left, originalIndex: leftIndex }, { value: right, originalIndex: rightIndex }) => {
        const comparison = compareCellValues(left, right)
        return comparison === 0
          ? leftIndex - rightIndex
          : sortDirection === "asc" ? comparison : -comparison
      })
        .map(({ row }) => row),
      ...summaryRows,
    ]
  }, [actionColumnIndex, bodyRows, sortColumn, sortDirection])

  const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize))
  React.useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, pageCount))
  }, [pageCount])

  const visibleRows = hasEmptyState
    ? sortedRows
    : sortedRows.slice((page - 1) * pageSize, page * pageSize)

  const enhancedHeader = tableHeader && React.cloneElement(
    tableHeader,
    {},
    flattenChildren(tableHeader.props.children).map((headerRow) => {
      if (!React.isValidElement(headerRow) || headerRow.type !== TableRow) return headerRow
      let columnIndex = 0
      return React.cloneElement(
        headerRow as GridElement,
        {},
        flattenChildren((headerRow as GridElement).props.children).map((cell) => {
          if (!React.isValidElement(cell) || cell.type !== TableHead) return cell
          const currentIndex = columnIndex++
          const label = getTextContent(cell.props.children).trim()
          const isAction = currentIndex === actionColumnIndex
          const canSort = !isAction && label.length > 0
          const isSorted = sortColumn === currentIndex
          const sortIcon = isSorted
            ? sortDirection === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />
            : <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />

          return React.cloneElement(cell as GridElement, {
            className: cn(
              cell.props.className,
              isAction && "sticky right-0 z-20 border-l border-white/20 bg-[hsl(220_70%_28%)] shadow-[-8px_0_12px_-8px_hsl(var(--foreground)/0.35)]",
              canSort && "cursor-pointer select-none"
            ),
            "aria-sort": canSort && isSorted
              ? sortDirection === "asc" ? "ascending" : "descending"
              : undefined,
            onClick: undefined,
          }, canSort ? (
            <button
              type="button"
              className="inline-flex items-center gap-2 text-left font-semibold"
              onClick={(event) => {
                event.stopPropagation()
                if (sortColumn === currentIndex) {
                  setSortDirection((direction) => direction === "asc" ? "desc" : "asc")
                } else {
                  setSortColumn(currentIndex)
                  setSortDirection("asc")
                }
                setPage(1)
              }}
            >
              <span>{label}</span>
              {sortIcon}
            </button>
          ) : cell.props.children)
        })
      )
    })
  )

  const enhancedBody = tableBody && React.cloneElement(
    tableBody,
    {},
    visibleRows.map((row) => {
      let columnIndex = 0
      return React.cloneElement(
        row,
        {},
        flattenChildren(row.props.children).map((cell) => {
          if (!React.isValidElement(cell) || cell.type !== TableCell) return cell
          const currentIndex = columnIndex++
          return currentIndex === actionColumnIndex
            ? React.cloneElement(cell as GridElement, {
                className: cn(
                  cell.props.className,
                  "sticky right-0 z-10 border-l border-border bg-card shadow-[-8px_0_12px_-8px_hsl(var(--foreground)/0.25)]"
                ),
              })
            : cell
        })
      )
    })
  )

  const enhancedChildren = tableChildren.map((child) => {
    if (child === tableHeader) return enhancedHeader
    if (child === tableBody) return enhancedBody
    return child
  })

  return (
    <div className="relative w-full min-w-0 overflow-x-auto rounded-md border border-border">
      <table
        ref={ref}
        className={cn(
          className,
          "!w-full min-w-max caption-bottom text-[13px] [&_th]:!h-10 [&_th]:!px-4 [&_th]:!py-0 [&_th]:!text-xs [&_td]:!px-3 [&_td]:!py-2"
        )}
        {...props}
      >
        {enhancedChildren}
      </table>
      {tableBody && (
        <div className="flex flex-col gap-3 border-t border-border bg-card px-3 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor={pageSizeId} className="whitespace-nowrap">Rows per page</label>
            <select
              id={pageSizeId}
              aria-label="Rows per page"
              className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground"
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value))
                setPage(1)
              }}
            >
              {[20, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
            <span>
              {hasEmptyState || sortedRows.length === 0
                ? "No rows"
                : `Showing ${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, sortedRows.length)} of ${sortedRows.length}`}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <span className="whitespace-nowrap">Page {page} of {pageCount}</span>
            <button
              type="button"
              aria-label="Previous page"
              className="inline-flex h-8 items-center gap-1 rounded-md border border-input px-2 text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              disabled={page <= 1}
              onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <button
              type="button"
              aria-label="Next page"
              className="inline-flex h-8 items-center gap-1 rounded-md border border-input px-2 text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              disabled={page >= pageCount}
              onClick={() => setPage((currentPage) => Math.min(pageCount, currentPage + 1))}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
})
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      "table-header text-white [&_tr]:border-b [&_tr]:border-white/20 [&_th]:!text-white [&_th_button]:!text-xs [&_th_button]:!text-white [&_th_button:hover]:!bg-white/10 [&_th_button:hover]:!text-white",
      className
    )}
    {...props}
  />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn(
      "[&_tr:nth-child(even)]:bg-muted/40 [&_tr:hover]:bg-primary/10 [&_tr:last-child]:border-0",
      className
    )}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-primary/10 data-[state=selected]:bg-primary/15",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-10 px-4 text-left align-middle text-xs font-semibold text-white !normal-case !tracking-normal [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(className, "px-3 py-2 align-middle !text-[13px] [&:has([role=checkbox])]:pr-0")}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
