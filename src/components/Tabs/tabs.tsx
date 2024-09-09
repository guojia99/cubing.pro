import React, {JSX} from "react";
import './tabs.css'
import {GetLocationQueryParams, UpdateBrowserURL} from "@/utils/uri/params";

export type TabNavsPage = {
  Id: string;
  Name: JSX.Element;
  Page: JSX.Element;
}

export type TabNavsValue = {
  Id: string;
  SelectedKey: string;
  Pages: TabNavsPage[];
  Center: boolean;
}


// todo 整顿ID和key的关系

export const TabNav = (tb: TabNavsValue) => {
  function selectedFn(value: string) {
    return function () {
      UpdateBrowserURL(tb.SelectedKey, value)
    }
  }

  if (tb.Pages === undefined || tb.Pages.length === 0) {
    return <div></div>
  }


  const p = GetLocationQueryParams()
  const selected = p[tb.SelectedKey] === undefined ? tb.Pages[0].Id : p[tb.SelectedKey]

  const center = tb.Center ? " justify-content-center" : ""
  // GoToSh()
  return (
    <div key={tb.Id}>
      <ul className={"nav nav-tabs" + center} role="tablist" key={"tab_tabs_base_ul" + tb.Id}>
        {Array.from(Array(tb.Pages.length), (e, i) => {
          const active = tb.Pages[i].Id === selected ? "active" : ""
          return (
            <li className="nav-item" role="presentation" key={"tab_tabs_nav_" + tb.Pages[i].Id}>
              <button className={"nav-link " + active}
                      id={tb.Id + tb.Pages[i].Id + "-tab"}
                      data-bs-toggle="tab"
                      data-bs-target={"#" + tb.Id + tb.Pages[i].Id}
                      type="button"
                      role="tab"
                      key={"tab_tabs_button_" + tb.Pages[i].Id}
                      aria-controls={tb.Id + tb.Pages[i].Id}
                      aria-selected={tb.Pages[i].Id === selected}
                      onClick={selectedFn(tb.Pages[i].Id)}
              >{tb.Pages[i].Name}</button>
            </li>
          )
        })}
      </ul>
      <div className="tab-content">
        {Array.from(Array(tb.Pages.length), (e, i) => {
          const active = tb.Pages[i].Id === selected ? " show active" : ""
          return (
            <div className={"tab-pane fade" + active}
                 id={tb.Id + tb.Pages[i].Id}
                 role="tabpanel"
                 key={"tabs_pane_" + tb.Pages[i].Id}
                 aria-labelledby={tb.Id + tb.Pages[i].Id + "-tab"}
                 tabIndex={i}
            >{tb.Pages[i].Page}</div>
          )
        })}
      </div>
    </div>
  )
}

export const TabNavsHorizontal = (tb: TabNavsValue) => {
  function selectedFn(value: string) {
    return function () {
      UpdateBrowserURL(tb.SelectedKey, value)
    }
  }

  const p = GetLocationQueryParams()
  const selected = p[tb.SelectedKey] === undefined ? tb.Pages[0].Id : p[tb.SelectedKey]

  return (
    <div className="d-flex" key={tb.Id}>
      <div className="nav nav-tabs flex-column nav-pills col-3 col-lg-1" role="tablist"
           aria-orientation="vertical" key={"tab_tabs" + tb.Id}>
        {Array.from(Array(tb.Pages.length), (e, i) => {
          const active = tb.Pages[i].Id === selected ? "active" : ""
          const id = tb.Pages[i].Id + "-tab"
          return (
            <button className={"nav-link alert-secondary " + active}
                    id={id}
                    key={"tab_key_" + id}
                    data-bs-toggle="pill"
                    data-bs-target={"#" + tb.Pages[i].Id}
                    type="button"
                    role="tab"
                    aria-controls={tb.Pages[i].Id}
                    aria-selected={tb.Pages[i].Id === selected}
                    onClick={selectedFn(tb.Pages[i].Id)}
            >
              {tb.Pages[i].Name}
            </button>
          )
        })}
      </div>
      <div className="tab-content flex-column col-9 col-lg-11" style={{paddingLeft: "10px"}}>
        {Array.from(Array(tb.Pages.length), (e, i) => {
          const active = tb.Pages[i].Id === selected ? "active" : ""
          return (
            <div className={"tab-pane fade show " + active}
                 id={tb.Pages[i].Id}
                 key={"tab_content_" + tb.Pages[i].Id}
                 role="tabpanel"
                 aria-labelledby={tb.Pages[i].Id + "-tab"}
                 tabIndex={i}
            >
              {tb.Pages[i].Page}
            </div>
          )
        })}
      </div>
    </div>)
}
